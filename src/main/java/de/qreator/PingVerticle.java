package de.qreator;
/*
 * Copyright 2013 Red Hat, Inc.
 *
 * Red Hat licenses this file to you under the Apache License, version 2.0
 * (the "License"); you may not use this file except in compliance with the
 * License.  You may obtain a copy of the License at:
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * @author <a href="http://tfox.org">Tim Fox</a>
 */


import io.vertx.core.Vertx;
import io.vertx.core.eventbus.EventBus;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.SockJSHandler;
import java.net.InetAddress;

/*import org.vertx.java.core.http.HttpServer;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.platform.Verticle;
*/
/*
 This is a simple Java verticle which receives `ping` messages on the event bus and sends back `pong` replies
 */
public class PingVerticle  {

   
    public static void main(String [] s) {
        int port=8080;
        if (s.length==1){
            port=Integer.parseInt(s[0]); // betriebsmodus festlegen: 
            
            
        }
        
        Vertx vertx = Vertx.vertx();
        io.vertx.core.http.HttpServer server = vertx.createHttpServer();
        
        Router router = Router.router(vertx); 
        SockJSHandler sockJSHandler = SockJSHandler.create(vertx);
        PermittedOptions [] inboundPermitted=new PermittedOptions[3];
        inboundPermitted[0] = new PermittedOptions().setAddress("scrabble.alle");
        inboundPermitted[1] = new PermittedOptions().setAddress("scrabble.spielfeld");
        inboundPermitted[2] = new PermittedOptions().setAddressRegex("scrabble.spieler\\..+");
        //PermittedOptions outboundPermitted = new PermittedOptions().setAddress("de.qreator.led");
        BridgeOptions options = new BridgeOptions();
        for (int i=0;i<3;i++){
            options.addInboundPermitted(inboundPermitted[i]);
            options.addOutboundPermitted(inboundPermitted[i]);
        }
        

        sockJSHandler.bridge(options);
        
        router.route("/bridge/*").handler(sockJSHandler);
        router.route("/*").handler(StaticHandler.create()); // webroot unter src/main/resources/webroot        
        server.requestHandler(router::accept).listen(port);

        EventBus eb = vertx.eventBus();
        
        
/*
        HttpServer server = vertx.createHttpServer();
        server.requestHandler(req -> {
            String file = req.path().equals("/") ? "index.html" : req.path();
            req.response().sendFile("./web/"+file);
        });

        JsonObject config = new JsonObject().putString("prefix", "/bridge");

        JsonArray inboundPermitted = new JsonArray();
        JsonObject inboundPermitted1 = new JsonObject().putString("address", "scrabble.alle");
        inboundPermitted.add(inboundPermitted1);
        JsonObject inboundPermitted2 = new JsonObject().putString("address", "scrabble.spielfeld");
        inboundPermitted.add(inboundPermitted2);
        JsonObject inboundPermitted3 = new JsonObject().putString("address_re", "scrabble.spieler\\..+");
        inboundPermitted.add(inboundPermitted3);

        JsonArray outboundPermitted = new JsonArray();
        JsonObject outboundPermitted1 = new JsonObject().putString("address", "scrabble.alle");
        outboundPermitted.add(outboundPermitted1);
        JsonObject outboundPermitted2 = new JsonObject().putString("address", "scrabble.spielfeld");
        outboundPermitted.add(outboundPermitted2);
        JsonObject outboundPermitted3 = new JsonObject().putString("address_re", "scrabble.spieler\\..+");
        outboundPermitted.add(outboundPermitted3);

        vertx.createSockJSServer(server).bridge(config, inboundPermitted, outboundPermitted);

        server.listen(8080);
        */
        try{
        System.out.println("Spieler bitte mit Browser anmelden unter \nhttp://"+InetAddress.getLocalHost().getHostAddress()+":"+port+"/spieler.html");
        
        } catch(Exception e){
            e.printStackTrace();
        }
        
    }
}
