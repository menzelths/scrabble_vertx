$(document).ready(function(){
    var buchstabenwerte=[1,6,3,4,1,1,4,2,2,1,6,4,2,3,1,2,8,4,10,1,1,1,1,6,6,3,8,10,3,0];
    var buchstabenhaeufigkeiten=[5,1,2,2,4,15,2,3,4,6,1,2,3,4,9,3,1,1,1,6,7,6,6,1,1,1,1,1,1,20];
    var buchstaben=["A","Ä","B","C","D","E","F","G","H","I","J","K","L","M","N","O","Ö","P","Q","R","S","T","U","Ü","V","W","X","Y","Z","_"];
    var buchstabenTopf=[];
    var blanko=2;
    var oben=0;
    $("body").html("Spielfeld!");
    var eb = new vertx.EventBus('/bridge');
    var spielernummer=0;
    var spieler=[];
    var anmeldung=true;
    eb.onopen = function() {

      eb.registerHandler('scrabble.spielfeld', function(message) {

        var typ=message.typ;
        if (typ==="spielnr"&&anmeldung===true){
            var uuid=message.nr;
            
            spieler[spielernummer]=uuid; // speichern für kommunikation
            spielernummer++;
            var adresse="scrabble.spieler."+uuid;
            eb.send(adresse,{typ:"nr",wert:""+spielernummer});
            eb.publish("scrabble.alle",{typ:"anmeldung",wert:""+spielernummer});
        } else if (typ==="spielnr"&&anmeldung===false){
            var uuid=message.nr;
            var adresse="scrabble.spieler."+uuid;
            eb.send(adresse,{typ:"ablehnung"});
        } else if (typ==="start"){
            anmeldung=false;
            starteSpiel();
        }

      });
      
      function buchstabenTopfErstellen(){ // baut die buchstaben zusammen
          buchstabenTopf=[];
          for (var i=0;i<buchstabenhaeufigkeiten.length;i++){
              for (var j=0;j<buchstabenhaeufigkeiten[i];j++){
                  buchstabenTopf.push(i);
              }
          }
          oben=buchstabenTopf.length; // oberster wert
      }
      
      function zieheBuchstaben(n){ // zieht n buchstaben aus dem topf
          var bs=[];
          for (var i=0;i<n;i++){
              var gezogen=zieheBuchstabe();
              if (gezogen>=0){
                bs.push(gezogen);
            } 
          }
          return bs;
      }
      
      function zieheBuchstabe(){ // zieht einen einzelnen buchstaben aus dem topf
          if (oben>0){
          var zz=parseInt(Math.random()*oben);
          var gezogen=buchstabenTopf[zz];
          buchstabenTopf[zz]=buchstabenTopf[oben-1];
          oben--;
          return gezogen;
      } else {
          return -1;
      }
      }
      
      function starteSpiel(){ // teile allen personen spielsteine aus
          eb.publish("scrabble.alle",{typ:"start"});
          buchstabenTopfErstellen();
          for (var i=0;i<spieler.length;i++){ // buchstaben austeilen
              var bs=zieheBuchstaben(7);
              var feld=[];
              if (bs.length>0){
                  for (var j=0;j<bs.length; j++){
                      feld.push(buchstaben[bs[j]]); // den entsprechenden buchstaben dazu
                      feld.push(buchstabenwerte[bs[j]]);
                  }
              }
              eb.send("scrabble.spieler."+spieler[i],{typ:"buchstaben",wert:feld,bs:buchstaben,werte:buchstabenwerte});
          }
          // jetzt zufälligen spieler starten lassen
          var zufall=parseInt(Math.random()*spieler.length);
          
          eb.send("scrabble.spieler."+spieler[zufall],{typ:"bistdran"});
      }
  };
  
});