$(document).ready(function() {
    var zeilen = 15;
    var buchstabenwerte = [1, 6, 3, 4, 1, 1, 4, 2, 2, 1, 6, 4, 2, 3, 1, 2, 8, 4, 10, 1, 1, 1, 1, 6, 6, 3, 8, 10, 3, 0];
    var buchstabenhaeufigkeiten = [5, 1, 2, 2, 4, 15, 2, 3, 4, 6, 1, 2, 3, 4, 9, 3, 1, 1, 1, 6, 7, 6, 6, 1, 1, 1, 1, 1, 1, 2];
    var buchstaben = ["A", "Ä", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "Ö", "P", "Q", "R", "S", "T", "U", "Ü", "V", "W", "X", "Y", "Z", "_"];
    //0 normal, 1 start, 2 doppelter bs, 3 dreifacher bs, 4 doppeltes w, 5 dreifaches w
    
    var uebersicht="";
    for (var i=0;i<buchstaben.length;i++){
        uebersicht+=buchstabenhaeufigkeiten[i]+"_"+buchstaben[i]+buchstabenwerte[i]+"<br>";
    }
    var scrabblefeld = [];
    var punkte = [];
    var rot;
    var ueberpruefung = false;
    var negativpunkte = 0;
    var aktuellesDelta = 0;
    var jastimmen = 0;
    var neinstimmen = 0;
    var zug = 0;
    var sieger = -1;
    var brettpunkte = [];
    var spielende = false;
    var siegernr = -1;
    var zeichnerot=false;
    var alle = false; // ob der aktuelle spieler alle steine benutzt hat (dann 50 punkte zusätzlich)
    var tempfeld = []; // feld zur überprüfung der summe
    var farben = ["#ffffff", "#ffaaaa", "#A9E2F3", "#58ACFA", "#ffff00", "#FF8000"];
    scrabblefeld[0] = "500200050002005";
    scrabblefeld[1] = "040003000300040";
    scrabblefeld[2] = "004000202000400";
    scrabblefeld[3] = "200400020004002";
    scrabblefeld[4] = "000040000040000";
    scrabblefeld[5] = "030003000300030";
    scrabblefeld[6] = "002000202000200";
    scrabblefeld[7] = "500200010002005";
    for (var i = 0; i < 7; i++) {
        scrabblefeld[8 + i] = scrabblefeld[6 - i];
    }
    var c = null; // graphischer kontext
    var gedreht = false;
    var feld = []; // spielfeldwerte
    var rotfeld = []; //  rotwerte
    var belegung = [];
    var buchstabenTopf = [];
    var blanko = 2;
    var passzaehler = 0;
    var oben = 0;
    var aktuellesX = 0, aktuellesY = 0;
    var breite = 450;
    var fb = breite / 15; // feldbreite
    var schriftgroesse = fb / 2;
    $("body").html("");
    $("body").append("<table><tr><td><div id='qrcode'></div></td><td valign='top'><div class='farbig'> <div class='aktuell' id='aktuell'>Alle Spieler bitte anmelden auf <p><b>"+location.href+"spieler.html</b><p></div><div class='punkte' id='punkte'>Wenn alle Spieler angemeldet sind, kann Spieler 1 das Spiel starten.</div></div><p><div class='farbig2'><div class='info' id='nachricht'>Noch kein Spieler angemeldet!</div></div></td><td><div id='uebersicht'> </div></td></tr></table>");

    //$("body").append("<div class='aktuell' id='aktuell'/><div class='punkte' id='punkte'/><div class='info' id='nachricht'/>");
    new QRCode(document.getElementById("qrcode"), 
    {
    text: location.href+"spieler.html",
    width: breite*2/3,
    height: breite*2/3,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});
    //c = $("#bild")[0].getContext("2d");
    var eb = new vertx.EventBus('/bridge');
    var spielernummer = 0;
    var spieler = [];
    var anmeldung = true;
    var geradedran = 0;
    var aktuelleswort = "";
    eb.onopen = function() {

        eb.registerHandler('scrabble.spielfeld', function(message, replier) {

            var typ = message.typ;
            if (typ === "spielnr" && anmeldung === true) {
                var uuid = message.nr;

                spieler[spielernummer] = uuid; // speichern für kommunikation
                spielernummer++;
                var adresse = "scrabble.spieler." + uuid;
                eb.send(adresse, {typ: "nr", wert: "" + spielernummer});
                eb.publish("scrabble.alle", {typ: "anmeldung", wert: "" + spielernummer});
                $("#nachricht").html("Anzahl der angemeldeten Spieler: " + spieler.length);
            } else if (typ === "spielnr" && anmeldung === false) {
                var uuid = message.nr;
                var adresse = "scrabble.spieler." + uuid;
                eb.send(adresse, {typ: "ablehnung"});
            } else if (typ === "start") {
                anmeldung = false;
                starteSpiel();
            } else if (typ === "vorschlag") {
                var uuid = message.nr;
                var wort = message.wort;
                alle = message.alle;
                gedreht = false;
                rot=message.rot;
                
                for (var i = 0; i < spieler.length; i++) {
                    if (spieler[i] === uuid && i === geradedran) {
                        aktuelleswort = wort;
                        eb.send("scrabble.spieler." + uuid, {typ: "verschieben"});
                        zeichneAktuellesWort(7, 7, false);
                    }
                }
            } else if (typ==="zeichnerot"){
                zeichnerot=true;
                renderFeld();
            } else if (typ === "schieben") {
                var uuid = message.nr;
                var dx = parseInt(message.dx);
                var dy = parseInt(message.dy);
                var drehen = message.drehen;
                if (drehen === true) {
                    if (gedreht === false) {
                        gedreht = true;
                    } else {
                        gedreht = false;
                    }
                }
                zeichneAktuellesWort(aktuellesX + dx, aktuellesY + dy, gedreht);
            } else if (typ === "wort_ok") {
                var uuid = message.nr;
                var ok = kontrolliereAktuellesWort();
                if (ok[1] > 0) { // wort in ordnung
                    var ergebnis = ok[2];
                    // $("#nachricht").html("");
                    var summe = 0;
                    var liste = [];
                    for (var i = 0; i < ergebnis.length; i += 2) {
                        //$("#nachricht").append("Wort: "+ergebnis[i]+", Wert: "+ergebnis[i+1]+"<br>");
                        summe += ergebnis[i + 1];
                        liste.push(ergebnis[i]);
                    }
                    //$("#nachricht").append("Gesamtsumme: "+summe);
                    // nachricht an alle schicken
                    if (spieler.length > 1) {
                        for (var i = 0; i < spieler.length; i++) {
                            if (i === geradedran) { // an den eigenen spieler schicken
                                eb.send("scrabble.spieler." + spieler[i], {typ: "warten"});
                            } else {
                                eb.send("scrabble.spieler." + spieler[i], {typ: "ueberpruefung", werte: liste});
                            }
                            ueberpruefung = true;
                            jastimmen = 0;
                            neinstimmen = 0;
                        }
                    } else {
                        macheweiter(); // bei nur einem spieler keine überprüfung
                    }
                }
            } else if (typ === "ja") { // wörter stimmen
                jastimmen++;
                
                if (neinstimmen + jastimmen === spieler.length - 1) {
                    if (jastimmen > (spieler.length - 1) / 2.0) { // nächster spieler
                        //eb.send("scrabble.spieler."+spieler[geradedran],{typ:"bistnichtdran"});
                        macheweiter();
                        // werte noch in belegung

                    } else {
                        // nochmal

                        eb.publish("scrabble.alle", {typ: "weiter"});
                        eb.send("scrabble.spieler." + spieler[geradedran], {typ: "bistdran"});
                        renderFeld();
                        $("#nachricht").html("Das Wort von Spieler " + (geradedran + 1) + " wurde gerade mit " + neinstimmen + " zu " + jastimmen + " Stimmen abgelehnt!<p>Nochmal!")

                    }
                }
            } else if (typ === "nein") {
                neinstimmen++;
                if (neinstimmen + jastimmen === spieler.length - 1) {
                    if (jastimmen > (spieler.length - 1) / 2.0) { // nächster spieler
                        //eb.send("scrabble.spieler."+spieler[geradedran],{typ:"naechster"});
                        macheweiter();
                    } else {
                        // nochmal
                        eb.publish("scrabble.alle", {typ: "weiter"});
                        eb.send("scrabble.spieler." + spieler[geradedran], {typ: "bistdran"});
                        renderFeld();
                        $("#nachricht").html("Das Wort von Spieler " + (geradedran + 1) + " wurde gerade mit " + neinstimmen + " zu " + jastimmen + " Stimmen abgelehnt!<p>Nochmal!")
                    }

                }
            } else if (typ === "passen") {
                replier("OK");
                var feld2 = [];
                passzaehler++;
                var nachrichtentext = "Spieler " + (geradedran + 1) + " hat gepasst!<p>";
                if (passzaehler >= spieler.length * 2) {
                    nachrichtentext = "Jeder hat mindestens zwei Mal gepasst!<p>Spielende!<p>";
                    spielbeenden();
                } else {
                    eb.send("scrabble.spieler." + spieler[geradedran], {typ: "bistnichtdran", wert: feld2});


                    geradedran = (geradedran + 1) % spieler.length;
                    eb.send("scrabble.spieler." + spieler[geradedran], {typ: "bistdran"});

                    eb.publish("scrabble.alle", {typ: "weiter"});

                    renderFeld();

                    $("#nachricht").html(nachrichtentext + "Spieler " + (geradedran + 1) + " ist am Zug!");
                }
            } else if (typ === "tausch") {
                var text = message.wert;
                for (var i = 0; i < text.length; i++) { // erst buchstaben zurück in topf
                    var b = "" + text.charAt(i);
                    var index = buchstaben.indexOf(b);
                    if (index !== -1) {
                        buchstabenTopf[oben] = index;

                        oben++;
                    }
                }
                // jetzt neue ziehen


                var bs = zieheBuchstaben(text.length);
                var feld2 = [];
                if (bs.length > 0) {
                    for (var j = 0; j < bs.length; j++) {
                        feld2.push(buchstaben[bs[j]]); // den entsprechenden buchstaben dazu
                        feld2.push(buchstabenwerte[bs[j]]);
                    }
                }
                eb.send("scrabble.spieler." + spieler[geradedran], {typ: "bistnichtdran", wert: feld2});
                var nachrichtentext = "Spieler " + (geradedran + 1) + " hat Buchstaben getauscht!<p>";
                //$("#nachricht").html("Spieler "+(geradedran + 1)+" hat Buchstaben getauscht!");
                geradedran = (geradedran + 1) % spieler.length;
                eb.send("scrabble.spieler." + spieler[geradedran], {typ: "bistdran"});

                eb.publish("scrabble.alle", {typ: "weiter"});
                //zug++;
                renderFeld();
                $("#nachricht").html(nachrichtentext + "Spieler " + (geradedran + 1) + " ist am Zug!");
                //replier(b);
            } else if (typ === "punkte") {
                var uuid = message.nr;
                var nr = -1;
                for (var i = 0; i < spieler.length; i++) {
                    if (spieler[i] === uuid) {
                        nr = i;
                    }
                }
                if (nr !== sieger) {
                    brettpunkte[nr] = parseInt(message.punkte);
                    negativpunkte += parseInt(message.punkte);
                } else {
                    brettpunkte[nr] = 0;
                }
                //punkte[nr]-=parseInt(message.punkte);
                // das bekommt der sieger dazu
                if (brettpunkte.length === spieler.length) { // alle punkte beisammen

                    $("#nachricht").html("Das Spiel ist beendet!<p>");
                    for (var i = 0; i < spieler.length; i++) {
                        $("#nachricht").append("Brettpunkte Spieler " + (i + 1) + ": " + brettpunkte[i] + "<br>");
                    }
                    if (sieger !== -1) {
                        $("#nachricht").append("Summe: " + negativpunkte);
                    }
                    $("#nachricht").append("<p>Gesamtpunkte:<br>");
                    for (var i = 0; i < spieler.length; i++) {
                        if (sieger === i) {

                            $("#nachricht").append("Spieler " + (i + 1) + ": " + punkte[i] + "+" + negativpunkte + "=" + (punkte[i] + negativpunkte) + "<br>");
                            eb.send("scrabble.spieler." + spieler[i], {typ: "ende", punkte: punkte[i] + negativpunkte, sieger: true});
                        } else {
                            $("#nachricht").append("Spieler " + (i + 1) + ": " + punkte[i] + "-" + brettpunkte[i] + "=" + (punkte[i] - brettpunkte[i]) + "<br>");
                            eb.send("scrabble.spieler." + spieler[i], {typ: "ende", punkte: punkte[i] - brettpunkte[i], sieger: false});
                        }
                    }
                }
            }
        });

        function macheweiter() {
            var x = aktuellesX;
            var y = aktuellesY;
            var zaehler = 0;
            spielende = false;
            passzaehler = 0;



            for (var i = 0; i < aktuelleswort.length; i++) {
                if (aktuelleswort[i] !== "?") {
                    belegung[y * 15 + x] = aktuelleswort[i];
                    if (rot===true){
                        rotfeld[y*15+x]=1; // farbigen teil markieren
                    }
                    if (feld[y * 15 + x] > 0) {
                        feld[y * 15 + x] *= -1; // prämienpunkte annulieren
                    }
                    zaehler++;
                }
                if (gedreht === true) {
                    y++;

                } else {
                    x++;
                }
            }
            rot=false;
            punkte[geradedran] += aktuellesDelta;
            if (alle === true && oben > 0) {
                punkte[geradedran] += 50;
            } else if (alle === true && oben === 0) { // spielende
                spielende = true;
                sieger = geradedran;
            }



            renderFeld();
            var bs = zieheBuchstaben(zaehler);
            var feld2 = [];
            if (bs.length > 0) {
                for (var j = 0; j < bs.length; j++) {
                    feld2.push(buchstaben[bs[j]]); // den entsprechenden buchstaben dazu
                    feld2.push(buchstabenwerte[bs[j]]);
                }
            }



            if (spielende === false) {
                eb.send("scrabble.spieler." + spieler[geradedran], {typ: "bistnichtdran", wert: feld2, punkte: punkte[geradedran]});
                var allegeschafft = "";
                if (alle === true) {
                    allegeschafft = "Spieler " + (geradedran + 1) + " hat alle Steine abgelegt! 50 Punkte Bonus!<p>";
                }
                geradedran = (geradedran + 1) % spieler.length;
                eb.send("scrabble.spieler." + spieler[geradedran], {typ: "bistdran"});

                eb.publish("scrabble.alle", {typ: "weiter"});
                zug++;
                renderFeld();

                $("#nachricht").html(allegeschafft + "Spieler " + (geradedran + 1) + " ist am Zug!");
            } else {
                spielbeenden();
            }
        }

        function spielbeenden() {
            eb.publish("scrabble.alle", {typ: "spielende"});
        }

        function kontrolliereAktuellesWort() { //überprüft das aktuelle wort und gibt bei richtiger lage die punkte an
            var x = aktuellesX;
            var y = aktuellesY;
            var buchstabensumme = 0;
            var faktorwort = 1;
            var wort = "";
            var zaehlerzentrum = 0;


            for (var i = 0; i < aktuelleswort.length; i++) {
                var f = feld[y * 15 + x];
                var faktor = 1;
                if (f === 2) {
                    faktor = 2;
                } else if (f === 3) {
                    faktor = 3;
                } else if (f === 4) {
                    faktorwort *= 2;
                } else if (f === 5) {
                    faktorwort *= 3;
                } else if (f === 1) {
                    if (zug === 0)
                        faktorwort *= 2;
                    zaehlerzentrum++;
                }
                if (belegung[y * 15 + x] === " " && aktuelleswort[i] !== "?") {
                    // aktuelles wort nehmen
                    wort += aktuelleswort[i];
                    for (var j = 0; j < buchstaben.length; j++) {
                        if (buchstaben[j].toUpperCase()===buchstaben[j]){ // joker nicht zählen
                        if (buchstaben[j] === aktuelleswort[i]) {
                            buchstabensumme += buchstabenwerte[j] * faktor;
                        }
                    }
                    }
                } else if (belegung[y * 15 + x] !== " " && aktuelleswort[i] === "?") {
                    wort += belegung[y * 15 + x];
                    for (var j = 0; j < buchstaben.length; j++) {
                        if (buchstaben[j].toUpperCase()===buchstaben[j]){ // joker nicht zählen
                        if (buchstaben[j] === belegung[y * 15 + x]) {
                            buchstabensumme += buchstabenwerte[j] * faktor;
                        }
                    }
                    }
                } else {
                    faktorwort = 0; // ungültiges wort
                }
                if (gedreht === true) {
                    y++;

                } else {
                    x++;
                }
            }
            buchstabensumme *= faktorwort;
            if (buchstabensumme > 0) { // gesamtüberprüfung
                tempfeld = [];
                for (var i = 0; i < belegung.length; i++) {
                    tempfeld[i] = belegung[i];
                }
                var x = aktuellesX;
                var y = aktuellesY;
                for (var i = 0; i < aktuelleswort.length; i++) {
                    if (aktuelleswort[i] !== "?") {
                        tempfeld[y * 15 + x] = aktuelleswort[i];
                    }
                    if (gedreht === true) {
                        y++;

                    } else {
                        x++;
                    }
                }
                var x = aktuellesX;
                var y = aktuellesY;
                var gesamtergebnis = [];
                //$("#nachricht").html("");
                var ergebnis = sammelwort(x, y, aktuelleswort[0], gedreht); // wort selber testen
                if (ergebnis[0].length > 1) {
                    //$("#nachricht").append("Wort (Sammeln ohne Drehung): "+ergebnis[0]+", Wert: "+ergebnis[1]+"<br>");
                    gesamtergebnis.push(ergebnis[0]);
                    gesamtergebnis.push(parseInt(ergebnis[1]));
                }
                for (var i = 0; i < aktuelleswort.length; i++) {
                    if (aktuelleswort[i] !== "?") { // dann sammeln
                        var ergebnis = sammelwort(x, y, aktuelleswort[i], !gedreht);
                        if (ergebnis[0].length > 1) {
                            //$("#nachricht").append("Wort (Sammeln mit Drehung): "+ergebnis[0]+", Wert: "+ergebnis[1]+"<br>");
                            gesamtergebnis.push(ergebnis[0]);
                            gesamtergebnis.push(parseInt(ergebnis[1]));
                        }
                    }
                    if (gedreht === true) {
                        y++;

                    } else {
                        x++;
                    }
                }



                // noch schnell die umgebung des wortes testen
                var leerzaehler = 0;
                for (var i = 0; i < aktuelleswort.length; i++) {
                    if (aktuelleswort[i] === "?") {
                        leerzaehler++;
                    }
                }

                var zaehler = 0;
                if (leerzaehler === 0 && gesamtergebnis.length === 2 && gesamtergebnis[0].length === aktuelleswort.length) { // dann schauen, ob neues wort größer als altes
                    if (gedreht === false) {
                        // hier schauen, ob links oder rechts noch etwas steht
                        if (aktuellesX - 1 >= 0) {
                            if (belegung[(aktuellesY * 15 + aktuellesX - 1)] !== " ") {
                                zaehler++;
                            }
                        }
                        if (aktuellesX + aktuelleswort.length < 15) {
                            if (belegung[aktuellesY * 15 + aktuellesX + aktuelleswort.length] !== " ")
                                zaehler++;
                        }
                    } else {
                        // hier schauen, ob oben oder unten noch etwas steht
                        if (aktuellesY - 1 >= 0) {
                            if (belegung[(aktuellesY - 1) * 15 + aktuellesX] !== " ") {
                                zaehler++;
                            }
                        }
                        if (aktuellesY + aktuelleswort.length < 15) {
                            if (belegung[(aktuellesY + aktuelleswort.length) * 15 + aktuellesX] !== " ") {
                                zaehler++;
                            }
                        }
                    }
                    if (zug > 0 && zaehler === 0) {
                        buchstabensumme = 0;
                    }
                }

                if (gesamtergebnis.length === 0) {
                    buchstabensumme = 0;
                }

                if (zug === 0 && zaehlerzentrum === 0) {
                    buchstabensumme = 0;
                }
            }
            return [wort, buchstabensumme, gesamtergebnis];
        }

        function sammelwort(altx, alty, bs, g) { // überprüft wort mit bs an pos mit drehrichtung auf punkte
            var dx = 1, dy = 0;
            if (g === true) {
                dx = 0;
                dy = 1;
            }
            var x = altx, y = alty;
            var weiter = true;
            while (weiter === true) {
                if (x - dx >= 0 && y - dy >= 0 && tempfeld[(y - dy) * 15 + (x - dx)] !== " ") {
                    x -= dx;
                    y -= dy;
                } else {
                    weiter = false; // anfang gefunden
                }
            }
            // jetzt wort ablaufen
            weiter = true;
            var faktorwort = 1;
            var wort = "";
            var buchstabensumme = 0;
            while (weiter === true) {
                var f = feld[y * 15 + x];
                var faktor = 1;
                if (f === 2) {
                    faktor = 2;
                } else if (f === 3) {
                    faktor = 3;
                }

                var b = tempfeld[y * 15 + x];
                var t1 = x === altx;
                var t2 = y === alty;
                var t3 = x < 15;
                var t4 = y < 15;
                if (b !== " " && !(t1 && t2) && t3 && t4) {
                    wort += tempfeld[y * 15 + x];
                    for (var j = 0; j < buchstaben.length; j++) {
                        if (buchstaben[j].toUpperCase()===buchstaben[j]){ // joker nicht zählen
                        if (buchstaben[j] === tempfeld[y * 15 + x]) {
                            buchstabensumme += buchstabenwerte[j] * faktor;
                        }
                    }
                    }


                } else if (x === altx && y === alty) {
                    wort += bs;
                    for (var j = 0; j < buchstaben.length; j++) {
                        if (buchstaben[j].toUpperCase()===buchstaben[j]){ // joker nicht zählen
                        if (buchstaben[j] === bs) {
                            buchstabensumme += buchstabenwerte[j] * faktor;
                        }
                    }
                    }
                } else {
                    weiter = false;
                }
                if (weiter === true) {
                    if (f === 4) {
                        faktorwort *= 2;
                    } else if (f === 5) {
                        faktorwort *= 3;
                    } else if (f === 1) {
                        if (zug === 0)
                            faktorwort *= 2;
                    }
                }
                x += dx;
                y += dy;
            }
            buchstabensumme *= faktorwort;
            return [wort, buchstabensumme];
        }

        function zeichneAktuellesWort(xalt, yalt, gedreht) {
            renderFeld(); // feld erst neu zeichnen
            if (xalt < 0)
                xalt = 0;
            if (yalt < 0)
                yalt = 0;
            aktuellesX = xalt;
            aktuellesY = yalt;
            var xzaehler = xalt;
            var yzaehler = yalt;
            var x = xalt * fb;
            var y = yalt * fb;


            for (var i = 0; i < aktuelleswort.length; i++) {
                c.font = "bold " + schriftgroesse + "px Arial";
                c.textAlign = "center";
                c.fillStyle = "#ff0000";
                var text = "" + aktuelleswort[i].toUpperCase();
                
                if (text !== "?") {
                    c.fillStyle = "#008800";
                    if (belegung[yzaehler * 15 + xzaehler] !== " ") {
                        c.fillStyle = "#ff0000";
                    }

                    c.fillRect(x + 5, y + 5, fb - 10, fb - 10);
                    c.fillStyle = "#ffffff";
                    c.fillText(text, x + 4 + (fb - 8) / 2, y + schriftgroesse * 1.3);
                }
                if (gedreht === true) {
                    y += fb;
                    yzaehler++;
                } else {
                    x += fb;
                    xzaehler++;
                }
            }
            if (yzaehler > 15) {
                zeichneAktuellesWort(xalt, yalt - (yzaehler - 15), gedreht);

            }
            else if (xzaehler > 15) {
                zeichneAktuellesWort(xalt - (xzaehler - 15), yalt, gedreht);
            } else {
                var ok = kontrolliereAktuellesWort();
                if (ok[1] > 0) { // wort in ordnung
                    var ergebnis = ok[2];
                    $("#nachricht").html("");
                    var summe = 0;
                    var liste = [];
                    for (var i = 0; i < ergebnis.length; i += 2) {
                        $("#nachricht").append("Wort: " + ergebnis[i].toUpperCase() + ", Wert: " + ergebnis[i + 1] + "<br>");
                        summe += ergebnis[i + 1];
                        liste.push(ergebnis[i]);
                    }
                    $("#nachricht").append("Gesamtsumme: " + summe);
                    aktuellesDelta = summe; // zum punkte zählen
                    // nachricht an alle schicken
                    eb.send("scrabble.spieler." + spieler[geradedran], {typ: "ok_da"});

                } else {

                    $("#nachricht").html("Wort so nicht in Ordnung: " + ok[0]);
                    if (zug === 0) {
                        $("#nachricht").append("<p>Wort muss über das Startfeld in der Mitte gehen!");
                    }
                    eb.send("scrabble.spieler." + spieler[geradedran], {typ: "ok_weg"});


                }
            }
        }

        function buchstabenTopfErstellen() { // baut die buchstaben zusammen
            buchstabenTopf = [];
            for (var i = 0; i < buchstabenhaeufigkeiten.length; i++) {
                for (var j = 0; j < buchstabenhaeufigkeiten[i]; j++) {
                    buchstabenTopf.push(i);
                }
            }
            oben = buchstabenTopf.length; // oberster wert
        }

        function zieheBuchstaben(n) { // zieht n buchstaben aus dem topf
            var bs = [];
            for (var i = 0; i < n; i++) {
                var gezogen = zieheBuchstabe();
                if (gezogen >= 0) {
                    bs.push(gezogen);
                }
            }
            return bs;
        }

        function zieheBuchstabe() { // zieht einen einzelnen buchstaben aus dem topf
            if (oben > 0) {
                var zz = parseInt(Math.random() * oben);
                var gezogen = buchstabenTopf[zz];
                buchstabenTopf[zz] = buchstabenTopf[oben - 1];
                oben--;
                return gezogen;
            } else {
                return -1;
            }
        }

        function initialisiereFeld() { // startbelegung
            feld = [];
            belegung = [];
            //oben = 5; // nur zum test
            for (var i = 0; i < scrabblefeld.length; i++) {
                for (var j = 0; j < scrabblefeld[i].length; j++) {
                    feld.push(parseInt("" + scrabblefeld[i].charAt(j)));
                    if (Math.random() > 0) {
                        belegung.push(" ");
                    } else {
                        belegung.push(buchstaben[parseInt(Math.random() * buchstaben.length)]);
                    }
                    rotfeld.push(0); // farbe überall auf 0 setzen
                }
            }
        }

        function renderFeld() {
            c.fillStyle = "#ffffff";
            c.fillRect(0, 0, breite, breite);
            c.strokeStyle = "#888888";
            for (var i = 0; i <= breite; i += fb) {
                c.beginPath();
                c.moveTo(i, 0);
                c.lineTo(i, breite);
                c.stroke();
            }
            for (var i = 0; i <= breite; i += fb) {
                c.beginPath();
                c.moveTo(0, i);
                c.lineTo(breite, i);
                c.stroke();
            }
            for (var i = 0; i < feld.length; i++) {
                if (feld[i] > 0) {
                    c.fillStyle = farben[Math.abs(feld[i])];
                    c.fillRect(i % 15 * fb + 2, parseInt(i / 15) * fb + 2, fb - 4, fb - 4);
                }
            }
            for (var i = 0; i < belegung.length; i++) {
                c.font = "bold " + schriftgroesse + "px Arial";
                c.textAlign = "center";
                c.fillStyle = "#000000";
                var text = "" + belegung[i];
                if (text.toUpperCase()!==text){ // kleinbuchstabe = joker
                    c.fillStyle="#ff0000";
                    c.fillRect((i % 15) * fb , parseInt(i / 15) * fb, fb , fb );
                    c.fillStyle="#ffffff";
                    c.fillRect((i % 15) * fb +5, parseInt(i / 15) * fb+5, fb - 10, fb - 10);
                    c.fillStyle="#000000";
                    text=text.toUpperCase();
                }
                var farbe= rotfeld[i];
                if (farbe>0&&zeichnerot===true){
                    c.fillStyle="#ff0000";
                }
                if (text !== "?") {
                    c.fillText(text, (i % 15) * fb + 4 + (fb - 8) / 2, parseInt(i / 15) * fb + schriftgroesse * 1.3);
                }

            }
            $("#aktuell").html("Aktueller Spieler: " + (geradedran + 1));
            $("#punkte").html("");
            for (var i = 0; i < punkte.length; i++) {
                $("#punkte").append("Spieler " + (i + 1) + ": " + punkte[i] + "<br>");
            }
            $("#punkte").append("Restliche Steine: " + oben);
            $("#nachricht").html("");
        }

        function starteSpiel() { // teile allen personen spielsteine aus
            eb.publish("scrabble.alle", {typ: "start"});
            buchstabenTopfErstellen();
            for (var i = 0; i < spieler.length; i++) { // buchstaben austeilen
                punkte[i] = 0; // punkte zurücksetzen
                var bs = zieheBuchstaben(7);
                var feld2 = [];
                if (bs.length > 0) {
                    for (var j = 0; j < bs.length; j++) {
                        feld2.push(buchstaben[bs[j]]); // den entsprechenden buchstaben dazu
                        feld2.push(buchstabenwerte[bs[j]]);
                    }
                }
                eb.send("scrabble.spieler." + spieler[i], {typ: "buchstaben", wert: feld2, bs: buchstaben, werte: buchstabenwerte});
            }
            // jetzt zufälligen spieler starten lassen
            var zufall = parseInt(Math.random() * spieler.length);
            geradedran = zufall;
            eb.send("scrabble.spieler." + spieler[zufall], {typ: "bistdran"});
            $("#qrcode").html("<canvas id='bild' width='" + breite + "px' height='" + breite + "px'/>");
            $("#uebersicht").html(uebersicht).addClass("farbig3");
            
            c=$("#bild")[0].getContext("2d");
          
            initialisiereFeld();
            renderFeld();
            $("#nachricht").html("Los geht's!<p>Es beginnt Spieler " + (geradedran + 1));
        }
    };

});