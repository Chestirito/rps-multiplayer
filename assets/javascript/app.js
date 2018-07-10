$(function(){
    var config = {
        apiKey: "AIzaSyCExI1AO1Z2lsw5ntaab2mhj-Buw8wz2wE",
        authDomain: "uoftbootcampproject.firebaseapp.com",
        databaseURL: "https://uoftbootcampproject.firebaseio.com",
        projectId: "uoftbootcampproject",
        storageBucket: "uoftbootcampproject.appspot.com",
        messagingSenderId: "279986972674"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    var game = {
        reference : "room",
        maxPlayers : 2,
        currentPlayers: 0,
        p1Wins : 0,
        p2Wins : 0,
        p1Loses : 0,
        p2Loses : 0,
        timeOut : ""
    };
    var session = {
        playerId : 0,
        playerName: "",
        choice : "",
        choiceLonger : "",
        isStart : false,
        isChecked : false
    };
    
    
    var chatBox = {
        reference : "chat",
        height: 0
    }
    
    //initializeGame();
    function hideAll(){
        $("#choices1").hide();
        $("#choices2").hide();
        $("#chosen1").hide();
        $("#chosen2").hide();
        $(".inputName").hide();
        $(".playerBox").hide();
    }
    function loadGame(){
        hideAll();
        $(".inputName").show();
        $(".waiting").show();
    }
    loadGame();
    $(".gameStatus").on("click", "#joinBtn", function(){
        
        var player = $(".nameBar").val().trim();
        database.ref(game.reference).once('value').then(function(snapshot) {
            if(!snapshot.child('player1').exists()){
                
                session.playerName = player;
                session.playerId = 1;
                database.ref(game.reference+"/player1").update({
                    name : player
                });
                $(".inputName").hide();
            }
            else if(!snapshot.child('player2').exists()){
                session.playerName = player;
                session.playerId = 2;
                //console.log(session.playerId);
                database.ref(game.reference+"/player2").update({
                    name : player
                });
                $(".inputName").hide();
            }
            else if(snapshot.child('player2').exists() && snapshot.child('player1').exists()){
                //session.playerName = player;
                //session.playerId = 3;
                var message = "Room currently full, please try again later."; 
                /*database.ref(chatBox.reference).set({
                    user : session.playerName,
                    message : cannotJoinMssg
                });*/
                var mssgView = $(".texts");
                mssgView.append("<div class='sentMessage'>" + player + ": " + message + "</div>");
            }
        });
    });
    //function startListening(){

    database.ref(game.reference).on("value", function(snapshot){
        checkPlayers(snapshot);
        checkDisconnect(snapshot);
    });

    function checkPlayers(snapshot){
        if(snapshot.child('player1').exists()){
            $(".name1").text(snapshot.val().player1.name);
            $(".playerBox1").show();
            $(".waiting1").hide();
        }
        else{
            game.p1Wins = 0;
            game.p1Loses = 0;
            game.p2Loses = 0;
            game.p2Wins = 0;
            session.isStart = false;     
            session.isChecked = false;  
            $(".name1").text("");
            $(".playerBox1").hide();
            $(".waiting1").show();
            $(".choices").hide();  
            $(".chosen").hide();
            updateWinLoseTag();
            $(".outcome").text("");
            clearTimeout(game.timeOut);
            if(snapshot.child('player2').child("wins").exists()){
                database.ref('room/player2').update({
                    wins : null,
                    loses: null
                });
            }

            if(snapshot.child('player2').child("choice").exists()){
                database.ref('room/player2').update({
                    choice : null,
                    lChoice: null
                });
            }
        }

        if(snapshot.child('player2').exists()){
            $(".name2").text(snapshot.val().player2.name);
            $(".playerBox2").show();
            $(".waiting2").hide();
        }
        else{
            game.p1Wins = 0;
            game.p1Loses = 0;
            game.p2Loses = 0;
            game.p2Wins = 0;
            session.isStart = false;     
            session.isChecked = false;  
            $(".name2").text("");
            $(".playerBox2").hide();
            $(".waiting2").show();
            $(".choices").hide();  
            $(".chosen").hide();
            updateWinLoseTag();
            $(".outcome").text("");
            clearTimeout(game.timeOut);
            if(snapshot.child('player1').child("wins").exists()){
                database.ref('room/player1').update({
                    wins : null,
                    loses: null
                });
            }  

            if(snapshot.child('player1').child("choice").exists()){
                database.ref('room/player1').update({
                    choice : null,
                    lChoice: null
                });
            }
        }

        if(snapshot.child('player1').exists() && snapshot.child('player2').exists()){
                startGame();
                checkChoices(snapshot);
        }
    }
    function startGame(){
        if(!session.isStart){
            $("#choices" + session.playerId).show();
            session.isStart = true;
        }
    }


    $(".options").on("click", ".selection", function(){
        session.choice = $(this).attr("id");
        session.choiceLonger = $(this).text();
        database.ref(game.reference+"/player"+session.playerId).update({
            choice : session.choice,
            lChoice : session.choiceLonger
        });
        var chosen = $("#chosen" + session.playerId);
        chosen.text(session.choiceLonger);
        $("#choices" + session.playerId).hide();
        chosen.show();
    });
    function checkChoices(snapshot){
        if(!session.isChecked){
            if(snapshot.val().player2.choice !== undefined && snapshot.val().player1.choice !== undefined){
                $("#chosen1").text(snapshot.val().player1.lChoice);
                $("#chosen2").text(snapshot.val().player2.lChoice);
                $(".chosen").show();
                session.isChecked = true;
                checkResult(snapshot.val().player1.choice, snapshot.val().player2.choice);
                
            }
        }
        
    }

    function checkResult(choice1 , choice2){
        if(choice1 === "r" && choice2 === "s" || 
            choice1 === "p" && choice2 === "r" || 
            choice1 === "s" && choice2 === "p" )
        {
            game.p1Wins++;
            game.p2Loses++;
            resultBox("player1");
        }
        else if(choice1 === "r" && choice2 === "p" || 
                choice1 === "p" && choice2 === "s" || 
                choice1 === "s" && choice2 === "r")
        {
            game.p1Loses++;
            game.p2Wins++;
            resultBox("player2");
        }
        else if(choice1 === choice2)
        {
            resultBox("tie");
        }

        updateScores();
        updateWinLoseTag();
    }

    function resultBox(result){
        var resultMessage = $("<div>");
        if(result !== "tie"){
            database.ref(game.reference+"/"+result).once("value").then(function(snapshot){
                resultMessage.html("<h3>Winner</h3><h2>" + snapshot.val().name + "</h2>");
            });
        }
        else if(result === "tie"){
            resultMessage.html("<h2>It's a tie!</h2>");
        }
        $(".outcome").html(resultMessage);
        game.timeOut = setTimeout(resetGame, 3000);
    }
    function updateScores(){
        database.ref(game.reference+"/player1").update({
            wins : game.p1Wins,
            loses : game.p1Loses
        });
        database.ref(game.reference+"/player2").update({
            wins : game.p2Wins,
            loses : game.p2Loses
        });
    }
    function updateWinLoseTag(){
        $(".p1Wins").text(game.p1Wins);
        $(".p1Loses").text(game.p1Loses);
        $(".p2Wins").text(game.p2Wins);
        $(".p2Loses").text(game.p2Loses);
    }
    function resetGame(){
        session.choice = "";
        session.choiceLonger = "";
        session.isChecked = false;
        $("#choices" + session.playerId).show();
        $(".chosen").hide();
        $(".outcome").text("");
        database.ref(game.reference+"/player1").update({
            choice : null,
            lChoice : null
        });
        database.ref(game.reference+"/player2").update({
            choice : null,
            lChoice : null
        });
    }

    function checkDisconnect(){
        database.ref(game.reference+"/player"+session.playerId).onDisconnect().set({});
        database.ref(chatBox.reference).onDisconnect().update({
            user : session.playerName,
            message : "Has Disconnected"
        });
    }

    //****************CHATBOX************************
    $(".messageInput").on("submit", function(event){
        event.preventDefault();
        var inputMessage = $(".message").val();

        if(inputMessage != ""){
            database.ref(chatBox.reference).set({
                user : session.playerName,
                message : inputMessage
            });
        }
        $(".message").val("");
    });

    //var isFirst = true;
    database.ref(chatBox.reference).on("value", function(snapshot){
        
        if(snapshot.val().user !== "" && session.playerId !== 0){
            var mssgView = $(".texts");
            mssgView.append("<div class='sentMessage'>" + snapshot.val().user + ": " + snapshot.val().message + "</div>");
            //console.log($('.sentMessage').height());
            chatBox.height += parseInt($('.sentMessage').height());
            $('.texts').animate({scrollTop: chatBox.height});
        }
        
    });

});