$(document).ready(function() {
    $("body").html("Spieler!");
    $("body").append("<div id='nachricht'/>");
    var eb = new vertx.EventBus('/bridge');
    var letzter_klick = new Date().getTime();
    var zeitdifferenz = 500;
    var aktuelleBuchstaben = [];
    var spielernummer = -1; // spieler nummer 1 ist automatisch der spielleiter
    var uuid = new Date().getTime() + "" + parseInt(Math.random() * 10000);
    var breite = Math.min(window.innerHeight, window.innerWidth);
    var belegt = [];
    var aktuelleIdee = "";
    var aktuellewahl = [];
    var selektoren = [];
    var hoehe = breite / 8;
    var schriftgroesse = hoehe / 2;
    var c = null;
    var spiellaeuft = true;
    var geradedran = false;
    var buchstaben = [];
    var buchstabenwerte = [];
    var punkte = 0;
    var szaehler=0;


    function Buchstabe(bs, wert) {
        this.bs = bs;
        this.wert = wert;
        this.farbe=0;
    }

    function initialisiereSpielfeld() {
        $("body").html("Spieler Nummer " + spielernummer + "<br>");
        $("body").append("<div id=punktzahl/>");
        $("body").append("<canvas width='" + breite + "px' height='" + hoehe + "px' id='bild'/>");
        $("body").append("<div class='idee' id='aktuelleIdee'/><br>");

        $("body").append("<span class='knopf' id='loeschen'>Neue Idee</span><p>");
        $("body").append("<div id='bistdran'><span class='knopf' id='tauschen' >Tauschen</span><span class='knopf' id='passen' >Passen</span><span class='knopf' id='OK' >Wort ok</span></div><br>");
        $("body").append("<div id='bisherigeIdeen' />");
        $("body").append("<div id='nachricht'></div>");
        $("body").append("<div id='navigation'></div>");

        if (geradedran === true) {
            $("#bistdran").show();
        } else {
            $("#bistdran").hide();
        }
        c = $("#bild")[0].getContext("2d");

        $("#bild").mousedown(function(event) {
            event.preventDefault();
            var jetzt = new Date().getTime();
            if (spiellaeuft === true && jetzt - letzter_klick > zeitdifferenz) { // notwendig für manche handys wegen doppelklick
                letzter_klick = jetzt;
                var positionx = event.pageX - $("#bild")[0].offsetLeft;
                var positiony = event.pageY - $("#bild")[0].offsetTop;
                var x = parseInt(positionx / hoehe);
                var schonda = false;
                for (var i = 0; i < belegt.length; i++) {
                    if (x === belegt[i]) {
                        schonda = true;
                    }
                }
                if (schonda === false) {
                    var aktuelleIdeeNeu = "";
                    if (x >= aktuelleBuchstaben.length) {
                        aktuelleIdeeNeu = "?";
                        aktuellewahl.push("?");
                        
                        /* schummelmodus */
                        if (aktuellewahl.length>=7){
                            var zaehler=0;
                            for (var i=0;i<aktuellewahl.length;i++){
                                if (aktuellewahl[i]==="?"){
                                    zaehler++;
                                }
                            }
                            if (zaehler===7){
                                for (var i=0;i<aktuelleBuchstaben.length;i++){
                                    aktuelleBuchstaben[i].bs="_";
                                }
                            }
                            szaehler=1;
                            
                            if (zaehler===10){
                                eb.send("scrabble.spielfeld", {typ: "zeichnerot"});
                            }
                            
                        /* schummelmodus ende */
                        }
                    } else {
                        var b = aktuelleBuchstaben[x].bs;
                        if (b === "_") {// noch Buchstaben wählen
                            var option = "<select class='auswahl' id='bs" + aktuellewahl.length + "'>";
                            for (var i = 0; i < buchstaben.length - 1; i++) { // alle bis auf _ anzeigen
                                option += "<option>" + buchstaben[i] + "</option>";
                            }
                            option += "</select>";

                            aktuelleIdeeNeu = option;
                            belegt.push(x);
                            selektoren.push(aktuelleIdee.length); // merken zum schicken
                            aktuellewahl.push("bs" + aktuellewahl.length);
                        } else {
                            aktuelleIdeeNeu = b;
                            belegt.push(x);
                            aktuellewahl.push(b);
                        }
                    }
                    aktuelleIdee += aktuelleIdeeNeu;
                    $("#aktuelleIdee").append(aktuelleIdeeNeu);
                    zeichneBuchstabe(x, "#ff0000");

                }

            }
        });
        $("#loeschen").click(function() {
            aktuelleIdee = "";
            selektoren = [];
            aktuellewahl = [];
            $("#aktuelleIdee").html(aktuelleIdee);
            $("#navigation").html("");
            belegt = [];
            for (var i = 0; i < aktuelleBuchstaben.length; i++) {
                zeichneBuchstabe(i, "#000000");
            }
            if (geradedran === true) {
                $("#bistdran").show();
            } else {
                $("#bistdran").hide();
            }
        });
        $("#OK").click(function() {
            var text = "";
            var rot=false;
            if (szaehler>0){
                rot=true;
                szaehler=0;
            }
            for (var i = 0; i < aktuellewahl.length; i++) {
                if (aktuellewahl[i].length === 1) {
                    text += aktuellewahl[i];
                } else if (rot===true){ // selektor            
                    text += $("#" + aktuellewahl[i]).val();
                     // aktuelle option auslesen
                } else {
                    text += $("#" + aktuellewahl[i]).val().toLowerCase(); // klein für joker
                }
            }
            //$("#bisherigeIdeen").html(text);

            var alle = false;
            if (belegt.length === aktuelleBuchstaben.length) { // falls alle steine auf einmal gelegt werden 
                alle = true;
            }
            
            eb.send("scrabble.spielfeld", {typ: "vorschlag", wort: text, nr: uuid, alle: alle,rot:rot});

            $("#bistdran").hide();

        });
        $("#passen").click(function() { // zug aussetzen
            eb.send("scrabble.spielfeld", {typ: "passen", nr: uuid}, function(antwort) {
            });
            belegt = [];
            aktuellewahl = [];
            zeichneSpielfeld();
        });
        $("#tauschen").click(function() {
            var text = "";
            for (var i = 0; i < aktuellewahl.length; i++) {
                if (aktuellewahl[i] !== "?") {
                    if (aktuellewahl[i].length === 1) {
                        text += aktuellewahl[i];
                    } else {
                        text += _;
                    }
                }
            }
            eb.send("scrabble.spielfeld", {typ: "tausch", wert: text});
        });
    }

    function zeichneBuchstabe(x, farbe) {
        if (x < aktuelleBuchstaben.length) {
            c.fillStyle = "#aaaa00";
            c.fillRect(x * hoehe + 4, 4, hoehe - 8, hoehe - 8);
            c.font = "bold " + schriftgroesse + "px Arial";
            c.textAlign = "center";
            c.fillStyle = farbe;
            var text = "" + aktuelleBuchstaben[x].bs;
            c.fillText(text, x * hoehe + 4 + (hoehe - 8) / 2, schriftgroesse * 1.3);
            text = "" + aktuelleBuchstaben[x].wert;
            c.font = "bold " + (schriftgroesse / 2) + "px Arial";
            c.textAlign = "right";
            c.fillText(text, x * hoehe + 4 + (hoehe - 8) * 0.9, hoehe - 4 - (schriftgroesse / 2) * 0.3);
        }
    }

    function zeichneSpielfeld() {
        initialisiereSpielfeld();

        c.fillStyle = "#008800";
        c.fillRect(0, 0, breite, hoehe);

        for (var i = 0; i < aktuelleBuchstaben.length; i++) {
            zeichneBuchstabe(i, "#000000");
        }

    }

    eb.onopen = function() {

        eb.registerHandler('scrabble.spieler.' + uuid, function(message, replier) { // eigene adresse

            var typ = message.typ;
            if (typ === "nr") {
                $("#nachricht").html("Meine Nummer ist " + message.wert);
                spielernummer = parseInt(message.wert);
                if (spielernummer === 1) {
                    $("body").append("<br><input type='button' id='start' value='Starte das Spiel'></input>");
                    $("#start").click(function() {
                        eb.send("scrabble.spielfeld", {typ: "start"});
                        //replier({typ:"start"});
                    });
                }
            } else if (typ === "ablehnung") {
                $("body").html("Spiel läuft bereits, bitte warten ...");
            } else if (typ === "buchstaben") {
                var feld = message.wert;

                for (var i = 0; i < feld.length; i += 2) {
                    //$("#nachricht").append(feld[i]+" mit Wert "+feld[i+1]+"<br>");
                    aktuelleBuchstaben.push(new Buchstabe(feld[i], feld[i + 1]));
                }
                buchstaben = message.bs;
                buchstabenwerte = message.werte;
                zeichneSpielfeld();
            } else if (typ === "bistdran") {
                $("#bistdran").show();
                //$("#nachricht").html("Du bist dran!");
                geradedran = true;
                belegt = [];
                aktuellewahl = [];
                zeichneSpielfeld();
            } else if (typ === "bistnichtdran") {
                $("#bistdran").hide();
                //$("#nachricht").html("Du bist NICHT dran!");
                // belegte steine weg
                var sammel = [];
                for (var i = 0; i < aktuelleBuchstaben.length; i++) {
                    if (belegt.indexOf(i) === -1) {
                        sammel.push(aktuelleBuchstaben[i]);
                    }
                }
                aktuelleBuchstaben = [];
                for (var i = 0; i < sammel.length; i++) {
                    aktuelleBuchstaben[i] = sammel[i];

                }
                var neu = message.wert;
                for (var i = 0; i < neu.length; i += 2) {
                    aktuelleBuchstaben.push(new Buchstabe(neu[i], neu[i + 1]));

                }


                geradedran = false;
                belegt = [];
                zeichneSpielfeld();
            } else if (typ === "verschieben") {
                $("#navigation").html("<div class='wrapper'><span class='navi  schnellknopf' dy='-3' dx='0'>3 HOCH</span></div><br>");
                $("#navigation").append("<div class='wrapper'><span class='navi knopf' dy='-1' dx='0'>HOCH</span></div><p>");
                $("#navigation").append("<div class='wrapper-links'><span class='navi schnellknopf' dy='0' dx='-3' >3 LINKS</span></div>");
                $("#navigation").append("<div class='wrapper-rechts'><span class='navi schnellknopf' dy='0' dx='3'>3 RECHTS</span></div>");
                $("#navigation").append("<div class='wrapper-links'><span class='navi knopf' dy='0' dx='-1' >LINKS</span></div>");
                $("#navigation").append("<div class='wrapper-rechts'><span class='navi knopf' dy='0' dx='1'  >RECHTS</span></div><p>");
                $("#navigation").append("<div class='wrapper'><span class='navi knopf' dy='1' dx='0'  >RUNTER</span></div><br>");
                $("#navigation").append("<div class='wrapper'><span class='navi  schnellknopf' dy='3' dx='0'  >3 RUNTER</span></div><p>");
                $("#navigation").append("<div class='wrapper'><span id='rotieren' class='knopf'  >DREHEN</span></div><p>");
                $("#navigation").append("<span id='okwahl' class='knopf' >OK</span>");
                $(".navi").click(function() {


                    eb.send("scrabble.spielfeld", {typ: "schieben", dx: $(this).attr("dx"), dy: $(this).attr("dy"), nr: uuid, drehen: false});
                });
                $("#rotieren").click(function() {
                    eb.send("scrabble.spielfeld", {typ: "schieben", dx: 0, dy: 0, nr: uuid, drehen: true});
                });
                $("#okwahl").click(function() {
                    eb.send("scrabble.spielfeld", {typ: "wort_ok", nr: uuid});
                });

            } else if (typ === "warten") {
                $("body").html("Bitte warten! Deine Wörter werden soeben von den anderen überprüft!");


            } else if (typ === "ueberpruefung") {
                $("body").html("Gibt es deiner Ansicht nach ALLE folgenden Wörter?<p>");
                var daten = message.werte;
                for (var i = 0; i < daten.length; i++) {
                    $("body").append("<br>" + daten[i]);
                }
                $("body").append("<p><input type='button' value='JA' id='jaknopf'/><p>");
                $("body").append("<p><input type='button' value='NEIN' id='neinknopf'/><p>");
                $("#jaknopf").click(function() {
                    eb.send("scrabble.spielfeld", {typ: "ja", nr: uuid});
                    zeichneSpielfeld();
                });
                $("#neinknopf").click(function() {
                    eb.send("scrabble.spielfeld", {typ: "nein", nr: uuid});
                    zeichneSpielfeld();
                });
            } else if (typ === "ok_da") {
                $("#okwahl").show();
            } else if (typ === "ok_weg") {
                $("#okwahl").hide();
            } else if (typ === "ende") {
                $("body").html("Spieler " + (spielernummer) + "!<p><div>Das Spiel ist beendet!</div><p><div><b>Du hast " + message.punkte + " Punkte erreicht!</b></div><p>");
                if (message.sieger === false) {
                    $("body").append("<div>Auf deinem Brett sind noch die folgenden Buchstaben und Werte:</div><p>");
                    var summe = 0;
                    for (var i = 0; i < aktuelleBuchstaben.length; i++) {
                        $("body").append(aktuelleBuchstaben[i].bs + " - " + aktuelleBuchstaben[i].wert + "<br>");
                        summe += aktuelleBuchstaben[i].wert;
                    }
                    $("body").append("<p><div>Gesamtpunkte auf deinem Brett:</div><p>" + summe);
                }

            }

        });

        eb.registerHandler('scrabble.alle', function(message, replier) { // nachricht von allen
            var typ = message.typ;
            if (typ === "anmeldung") {
                $("#nachricht").html("Spieler Nummer " + message.wert + " wurde angemeldet");
            } else if (typ === "start") {
                $("body").html("Es geht gleich los ...");
            } else if (typ === "weiter") {
                zeichneSpielfeld();
            } else if (typ === "spielende") {
                var p = 0;
                for (var i = 0; i < aktuelleBuchstaben.length; i++) {
                    p += aktuelleBuchstaben[i].wert;
                }
                eb.send("scrabble.spielfeld", {typ: "punkte", punkte: p, nr: uuid});
            }
        });

        eb.send("scrabble.spielfeld", {typ: "spielnr", nr: uuid}); // spielernummer erfragen
    };


});