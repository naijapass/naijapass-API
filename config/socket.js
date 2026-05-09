
import {Server} from "socket.io";
import express from "express";
import http from "http";
import dotenv from "dotenv";

const allowedOrigins = [
    "http://localhost:5173",
  ];

const app = express();



const server = http.createServer(app);
dotenv.config();

const io = new Server(server, {
    cors:{
        origin: allowedOrigins, //process.env.CLIENT_URL,
        methods:['GET','POST']
    }
})
console.log("Socket Here")
const userSocketMap = {} ; // this map stores socket id corresponding the user id; userId -> socketId
const generalStreamSocketMap = {} ; // this map stores socket id corresponding the user id; userId -> socketId

export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on('connection', (socket)=>{
    const userId = socket.handshake.query.userId;
    if(userId){
        // console.log("User connected")
        userSocketMap[userId] = socket.id;
        socket.on('joinLiveStreamRoom', (channelName) => {
            socket.join(channelName);
            if (generalStreamSocketMap[channelName]) {
                generalStreamSocketMap[channelName][userId] = socket.id;
            } else {
                generalStreamSocketMap[channelName] = {}
                generalStreamSocketMap[channelName][userId] = socket.id;
            }
            // generalStreamSocketMap[channelName][userId] = socket.id;
            io.emit('getActiveViewers', Object.keys(generalStreamSocketMap[channelName]));
            // console.log(`Socket ${socket.id} joined room: ${channelName}`);
        });
        socket.on('leaveLiveStreamRoom', (channelName) => {
            socket.leave(channelName);
            delete generalStreamSocketMap[channelName][userId];
            io.emit('getActiveViewers', Object.keys(generalStreamSocketMap[channelName]));
        });
        socket.on('countLiveStreamRoom', (channelName) => {
            if (generalStreamSocketMap[channelName] && generalStreamSocketMap[channelName][userId] != socket.id) return []
            io.emit('getActiveViewers', Object.keys(generalStreamSocketMap[channelName]));
            // console.log(`tried to count Socket ${socket.id} joined room: ${channelName}`);
        });
        socket.on('disconnecting', (channelName) => {
            socket.leave(channelName);
            if (generalStreamSocketMap[channelName] && generalStreamSocketMap[channelName][userId]) delete generalStreamSocketMap[channelName][userId];
            if (generalStreamSocketMap[channelName]) io.emit('getActiveViewers', Object.keys(generalStreamSocketMap[channelName]));
            // console.log('Client is about to disconnect');
            // console.log(`tried to disconnect Socket ${socket.id} joined room: ${channelName}`);
            // socket.emit('disconnecting', { message: 'User is disconnecting' });
          });
        socket.on('sendLiveStreamMessage', ({ channelName, content, profileImage, username }) => {
            // console.log(`Message received in ${channelName}:`, { content, username });
            // Broadcast the message to everyone in the room except the sender
            socket.to(channelName).emit('receiveLiveStreamMessage', { channelName, content, profileImage, username });
        });
    }

    io.emit('getOnlineUsers', Object.keys(userSocketMap));
    io.emit('updateOnlineUsers', Object.keys(userSocketMap).length);


    socket.on('disconnect',()=>{
        if(userId){
            delete userSocketMap[userId];
        }
        // if (generalStreamSocketMap[channelName][userId]) {
        //     delete generalStreamSocketMap[channelName][userId];
        //     io.emit('getActiveViewers', Object.keys(generalStreamSocketMap[channelName]));
        // }
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
        io.emit('updateOnlineUsers', Object.keys(userSocketMap).length);

    });
})

// Add this to your existing socket.io code
let onlineUsers = new Set(); // Track online users

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    
    if (userId) {
        onlineUsers.add(userId);
        // console.log(`User ${userId} connected`);
        
        // Update all clients with current online count
        io.emit('online-users-count', onlineUsers.size);
    }

    socket.on('disconnect', () => {
        if (userId) {
            onlineUsers.delete(userId);
            // console.log(`User ${userId} disconnected`);
            
            // Update all clients with current online count
            io.emit('online-users-count', onlineUsers.size);
        }
    });
});

// Add this helper function
export const getOnlineUsersCount = () => {
    return onlineUsers.size;
};

export {app, server, io};
