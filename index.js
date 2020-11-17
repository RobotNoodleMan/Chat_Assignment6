"use script";

const { stringify } = require('querystring');

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var clientNum = 0;
//emojis = grin, frown, astonished
var emojis = [0x1F601,0x2639,0x1F632];
let msgList = [];
let users = [];
let cookies = [];
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', (socket) => {
  
  socket.emit('connection',"hello");
  //initial user emits
  console.log('a user connected ' + socket.id);
  
  socket.emit('id', socket.id );
  //emits chat history to all users 
  socket.emit('chat history',JSON.stringify(msgList));
  
  
  
  
  //puts new user in array of users and emits new user list to everyone
  users.push({ username: socket.id.toString(), id: socket.id, color:"000000" });
  clientNum++;
  io.emit('username',JSON.stringify(users))

  //For cookie management
  socket.on('cookie', (msg) =>
  {
    //Find the socket and user corresponding to each other
    cu = 0;
     for(let i =0; i<users.length;i++)
     {
       if(users[i].id === socket.id)
      {
        cu = i;
      }
     }
     //Find out if there is cookie saved with the correct value
    let cookieCheck =0;
    let sC = 0;
    for(let i =0; i<cookies.length;i++)
    {
      if(cookies[i].id === msg)
      {
        cookieCheck = 1;
        sC = i;
      }
    }
    //If cookie has never been found before
    if(cookieCheck === 0)
    {
      cookies.push({id: msg, username: users[cu].username});
    }
    //cookie does exist
    else
    {
      //check for existing usernames
      let exist = 1;
        for(let i =0; i<users.length;i++)
        {
         if(users[i].username === cookies[sC].username)
         {
           exist = 0;
         }
        }
         if(exist ===1)
         {
          users[cu].username = cookies[sC].username;
          io.emit('username',JSON.stringify(users))
         }
         else
         {
           users[cu].username = socket.id;
           socket.emit("Sorry, your old username was taken");
         }
          
    }

  });


  //On disconnect, the disconnecting user should be deleted from the stored list of users.
  socket.on('disconnect', () =>
  {
    console.log(socket.id + " has disconnected")
    for(let i = 0; i<users.length;i++)
    {
      if(socket.id === users[i].id)
        {
          users.splice(i,1);
        }
    }
    io.emit('username',JSON.stringify(users))
    clientNum--;
  });

  //Recieving a single message from socket
  socket.on('chat message', (msg) => 
  {
    //To get dates
    var d = new Date(); 
    let hour =d.getHours(); 
    let minute = d.getMinutes(); 
    if(minute<10)
    {
      minute = "0" + minute;
    }
     nTime =  hour+ ":" + minute; 

     //To get usernames of current user
     cu = 0;
     for(let i =0; i<users.length;i++)
     {
       if(users[i].id === socket.id)
      {
        cu = i;
      }
     }
     //name change
     if(msg.startsWith("/name"))
     {
        let split = msg.split(" ");
        newName = split[1]
        for(let i = 2; i<split.length;i++)
        {
          newName = newName + " " + split[i]
        }
        let exist = 1;
        for(let i =0; i<users.length;i++)
        {
          if(users[i].username === newName)
         {
           exist = 0;
         }
        }
         if(exist ===1)
         {
          for(let i =0; i<cookies.length;i++)
          {
            if(users[cu].username === cookies[i].username)
            {
              cookies[i].username = newName;
            }
          }
          users[cu].username = newName;
          socket.emit('chat message', "You have changed your username to " + users[cu].username);
          io.emit('username',JSON.stringify(users))
         }
         else
         {
          socket.emit('chat message', "Sorry, this name is taken! Please try again!");
         }
     }
     //colour change
     else if(msg.startsWith("/color"))
     {
        let split = msg.split(" ");
        newColor = split[1];
        users[cu].color = newColor;
        for(let i = 0; i<msgList.length;i++)
        {
          if(msgList[i].id === users[cu].id)
          {
            msgList[i].color = users[cu].color;
          }
        }
        io.emit('chat history',JSON.stringify(msgList));
        socket.emit('chat message', "You have successfully changed your colour");
     }
     //Standard operation of msgs
     else
     {
       if(msg.includes(":)"))
       {
         let e = String.fromCodePoint(emojis[0]);
         msg = msg.replace(":)",e);
       }
       if(msg.includes(":("))
       {
         let e = String.fromCodePoint(emojis[1]);
         msg = msg.replace(":(",e);
       } 
       if(msg.includes(":o"))
       {
         let e = String.fromCodePoint(emojis[2]);
         msg = msg.replace(":o",e);
       }
      msgList.push({time: nTime, username: users[cu].username, id: socket.id, message:msg, color:users[cu].color});
      if(msgList.length>200)
      {
        msgList.shift();
      }
      let sentMsg =  nTime + "  " +'<span style= "color:#' + users[cu].color  + '">' + users[cu].username + "</span>"+ " says: " + msg
      //io.emit('chat message',sentMsg);
      boldedMsg = sentMsg.bold();
      socket.emit('chat message', boldedMsg)
      socket.broadcast.emit('chat message', sentMsg);
     }

     

  
  
  });




});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
