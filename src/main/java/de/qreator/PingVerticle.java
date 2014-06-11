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

import java.io.File;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.http.HttpServer;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.platform.Verticle;

/*
 This is a simple Java verticle which receives `ping` messages on the event bus and sends back `pong` replies
 */
public class PingVerticle extends Verticle {

    @Override
    public void start() {

        HttpServer server = vertx.createHttpServer();
        server.requestHandler(req -> {
            String file = req.path().equals("/") ? "index.html" : req.path();
            File f = new File("src/main/resources/web" + file);
            req.response().sendFile(f.getAbsolutePath());
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
    }
}
