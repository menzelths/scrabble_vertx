package de.qreator;


import io.vertx.core.Vertx;
import io.vertx.core.eventbus.EventBus;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.SockJSHandler;
import java.net.InetAddress;

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
        
        try{
        System.out.println("Spieler bitte mit Browser anmelden unter \nhttp://"+InetAddress.getLocalHost().getHostAddress()+":"+port+"/spieler.html");
        
        } catch(Exception e){
            e.printStackTrace();
        }
        
    }
}
