const express=require("express");
const app=express();
const http=require("http");
const socketio=require("socket.io");
const server=http.createServer(app);
const io=socketio(server);
const path=require("path");

app.set("view engine","ejs");
app.set(express.static(path.join(__dirname,"public")));
app.use(express.static("public"));
io.on("connection",function(socket){
    socket.on("send-location",function(data){
        io.emit("receive-location",{id:socket.id,...data});
    })
    socket.on("disconnect",function(){
        io.emit("user-disconnected");
    })
})

app.get('/',function(req,res){
    res.render("index");
})

app.listen(8000);