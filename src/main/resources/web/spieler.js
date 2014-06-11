$(document).ready(function(){
    $("body").html("Spieler!");
    $("body").append("<div id='nachricht'/>");
    var eb = new vertx.EventBus('/bridge');
    var letzter_klick= new Date().getTime();
    var zeitdifferenz=500;
    var aktuelleBuchstaben=[];
    var spielernummer=-1; // spieler nummer 1 ist automatisch der spielleiter
    var uuid=new Date().getTime()+""+parseInt(Math.random()*10000);
    var breite = Math.min(window.innerHeight, window.innerWidth);
    var belegt=[];
    var aktuelleIdee="";
    var aktuellewahl=[];
    var selektoren=[];
    var hoehe=breite/8;
    var schriftgroesse=hoehe/2;
    var c=null;
    var spiellaeuft=true;
    var geradedran=false;
    var buchstaben=[];
    var buchstabenwerte=[];
    
    function Buchstabe(bs,wert){
        this.bs=bs;
        this.wert=wert;
    }
    
    function intitialisiereSpielfeld(){
        $("body").html("Spieler Nummer "+spielernummer+"<br>");
        
        $("body").append("<canvas width='"+breite+"px' height='"+hoehe+"px' id='bild'/>");
        $("body").append("<div id='aktuelleIdee'/>");
        $("body").append("<div id='OK'></div>");
        $("body").append("<div id='loeschen'>Neue Idee</div>");
        
        $("body").append("<div id='bisherigeIdeen' />");
        $("body").append("<div id='nachricht'></div>");
        if (geradedran===true){
            $("#OK").text("OK");
        }
        c=$("#bild")[0].getContext("2d");
        $("#bild").mousedown(function(event) {
        event.preventDefault();
        var jetzt=new Date().getTime();
        if (spiellaeuft === true&&jetzt-letzter_klick>zeitdifferenz) { // notwendig für manche handys wegen doppelklick
            letzter_klick=jetzt;
            var positionx = event.pageX - $("#bild")[0].offsetLeft;
            var positiony = event.pageY - $("#bild")[0].offsetTop;
            var x = parseInt(positionx/hoehe);
            var schonda=false;
            for (var i=0;i<belegt.length;i++){
                if (x===belegt[i]){
                    schonda=true;
                }
            }
            if (schonda===false){
                var aktuelleIdeeNeu="";
                if (x>=aktuelleBuchstaben.length){
                    aktuelleIdeeNeu="?";
                    aktuellewahl.push("?");
                } else {
                    var b=aktuelleBuchstaben[x].bs;
                    if (b==="_"){// noch Buchstaben wählen
                        var option="<select class='auswahl' id='bs"+aktuellewahl.length+"'>";
                        for (var i=0;i<buchstaben.length-1;i++){ // alle bis auf _ anzeigen
                            option+="<option>"+buchstaben[i]+"</option>";
                        }
                        option+="</select>";
                        
                        aktuelleIdeeNeu=option;
                        belegt.push(x);
                        selektoren.push(aktuelleIdee.length); // merken zum schicken
                        aktuellewahl.push("bs"+aktuellewahl.length);
                    } else {
                    aktuelleIdeeNeu=b;
                    belegt.push(x);
                    aktuellewahl.push(b);
                }
                }
                aktuelleIdee+=aktuelleIdeeNeu;
                $("#aktuelleIdee").append(aktuelleIdeeNeu);
                zeichneBuchstabe(x,"#ff0000");
                
            } 
            
        }
    });
    $("#loeschen").click(function(){
        aktuelleIdee="";
        selektoren=[];
        aktuellewahl=[];
        $("#aktuelleIdee").html(aktuelleIdee);
       
        belegt=[];
        for (var i=0;i<aktuelleBuchstaben.length;i++){
            zeichneBuchstabe(i,"#000000");
        }
    });
    $("#OK").click(function(){
        var text="";
        for (var i=0;i<aktuellewahl.length;i++){
            if (aktuellewahl[i].length===1){
                text+=aktuellewahl[i];
            } else { // selektor            
                text+=$("#"+aktuellewahl[i]).val();; // aktuelle option auslesen
            }
        }
        $("#bisherigeIdeen").html(text);
    });
    }
    
    function zeichneBuchstabe(x,farbe){
        if (x<aktuelleBuchstaben.length){
        c.fillStyle="#aaaa00";
            c.fillRect(x*hoehe+4,4,hoehe-8,hoehe-8);
        c.font = "bold " + schriftgroesse + "px Arial";
        c.textAlign = "center";
                c.fillStyle=farbe;
            var text=""+aktuelleBuchstaben[x].bs;
            c.fillText(text,x*hoehe+4+(hoehe-8)/2,schriftgroesse*1.3);
            text=""+aktuelleBuchstaben[x].wert;
            c.font = "bold " + (schriftgroesse/2) + "px Arial";
            c.textAlign="right";
            c.fillText(text,x*hoehe+4+(hoehe-8)*0.9,hoehe-4-(schriftgroesse/2)*0.3);
        }
    }
    
    function zeichneSpielfeld(){
        intitialisiereSpielfeld();
        
        c.fillStyle="#008800";
        c.fillRect(0,0,breite,hoehe);
        
        for (var i=0;i<aktuelleBuchstaben.length;i++){
            zeichneBuchstabe(i,"#000000");
        }
        
    }
    
    eb.onopen = function() {

      eb.registerHandler('scrabble.spieler.'+uuid, function(message) { // eigene adresse

        var typ=message.typ;
        if (typ==="nr"){
            $("#nachricht").html("Meine Nummer ist "+message.wert);
            spielernummer=parseInt(message.wert);
            if (spielernummer===1){
                $("body").append("<br><input type='button' id='start' value='Starte das Spiel'></input>");
                $("#start").click(function(){
                    eb.send("scrabble.spielfeld",{typ:"start"});
                });
            }
        } else if (typ==="ablehnung"){
            $("body").html("Spiel läuft bereits, bitte warten ...");
        } else if (typ==="buchstaben"){
            var feld=message.wert;
            
            for (var i=0;i<feld.length;i+=2){
                //$("#nachricht").append(feld[i]+" mit Wert "+feld[i+1]+"<br>");
                aktuelleBuchstaben.push(new Buchstabe(feld[i],feld[i+1]));
            }
            buchstaben=message.bs;
            buchstabenwerte=message.werte;
            zeichneSpielfeld();
        } else if (typ==="bistdran"){
            $("#OK").text("OK");
            $("#nachricht").html("Du bist dran!");
            geradedran=true;
        }

      });
      
            eb.registerHandler('scrabble.alle', function(message) { // nachricht von allen
        var typ=message.typ;
        if (typ==="anmeldung"){
            $("#nachricht").html("Spieler Nummer "+message.wert+" wurde angemeldet");
        } else if (typ==="start"){
            $("body").html("Es geht gleich los ...");
        }
      });
      
      eb.send("scrabble.spielfeld",{typ:"spielnr",nr:uuid}); // spielernummer erfragen
  };
  
  
});