const TelegramBot = require('node-telegram-bot-api');

const token = 'YOUR_TOKEN_HERE';

const bot = new TelegramBot(token, { polling: true })

const downloadDirectory = 'C:\\Users\\nightjar\\Documents\\mybot';

const fs = require('fs');
const { userInfo } = require('os');

var answerCallbacks = [];

var userColors = [];
var userTemperatures  = [];
var userTumble = [];
var userdAdditional = [];

var userData = []; 

function sendMultMessages(bot, chatId, messages)
{
    return Promise.mapSeries(messages, function(message){return bot.sendMessage(chatId, message)});
}


function sendImage(chatId,item)
{
    if(userData == undefined || userData[chatId] == undefined || userData[chatId].length == 0)
        {
            bot.sendMessage(chatId, "Nothing to wash yet");
        }
        else
        {
                var imageStream = fs.createReadStream(item.photo);
                bot.sendPhoto(chatId,imageStream,
                    {
                        caption: item.temperature+", "+item.color,
                    });
            
        }
}

bot.onText(
    /\/help/,
    async (msg, match)=>
    {
        const imageStream = fs.createReadStream('help.jpg'); 
        bot.sendPhoto(msg.chat.id, imageStream);

    });

bot.onText(
    /\/start/,
    async (msg, match)=>
    {
      var welcome = "Hello dear "+msg.from.first_name+"! This bot can help you to track your clothes' washing labels and create lists of clothes to wash! You can use such commands as:\n";
      var commands = "1.\/help - you will get a scheme how to understand washing label.\n2.Send me photo - it will be added to the list of your clothes. After photo I will ask some questions.\n3.Wash (add your parameters) and I will create a launry list with those parameters.\nI am not that smart, so be careful!";
      bot.sendMessage(msg.chat.id, welcome+commands);

    });

bot.on("message", function (msg) {
    const callback = answerCallbacks[msg.chat.id];
    if (callback) {
        delete answerCallbacks[msg.chat.id];
        return callback(msg);
    }
});

var askQuestion = async (chatId, question, array) => {
    await bot.sendMessage(chatId, question, {
        "reply_markup": {
            "keyboard": array
            }
        });
    return new Promise
    (
        fullfill => 
        {
            answerCallbacks[chatId] = 
            msg => 
            {
                if (msg.text[0] !== "/")
                {
                    fullfill(msg);
                }
            };
        }
    );
};

bot.on('photo',
        async (msg) => {
        var currentChatDownloadDir = downloadDirectory;
        var temp = [["Hand wash"], ["30"], ["40"], ["60"], ["90"]];
        var colors = [["Black", "White","Gray"], ["Beige","Yellow", "Blue"], ["Pink","Red", "Green"]];
        var tumble = [["Dry", "Low heat"], ["Medium heat", "High heat"], ["No heat. Only tumble"],["Not tumble dry"]];
        var additional = [["Wool", "Silk"], ["Sports uniform", "Shoes"], ["Delicate", "Synthetics"],["None"]];
        if(userData[msg.chat.id] == undefined || userData[msg.chat.id].length==0)
        {
            userData[msg.chat.id] = [];
            userColors[msg.chat.id] = [];
            userTemperatures[msg.chat.id] = [];
            userTumble[msg.chat.id] = [];
            userdAdditional[msg.chat.id] = [];
        }

           var file_name = await bot.downloadFile(msg.photo[1].file_id, currentChatDownloadDir);
      
        console.log("Images saved to dir");
        var item = {};

       const answerMessage2 = await askQuestion(msg.chat.id,"Choose temperature or enter by yourself: ", temp);

       console.log(answerMessage2); 
       await bot.sendMessage(msg.chat.id, "got it!");

       const answerMessage3 = await askQuestion(msg.chat.id,"Choose color or enter by yourself: ", colors);
       console.log(answerMessage3); 
       await bot.sendMessage(msg.chat.id, "got it!");

       const answerMessage4 = await askQuestion(msg.chat.id,"Choose tumble dry or enter by yourself: ", tumble);
       console.log(answerMessage4); 
       await bot.sendMessage(msg.chat.id, "got it!");

       const answerMessage5 = await askQuestion(msg.chat.id,"Is there anything else I need to know about this item? ", additional);
       console.log(answerMessage5); 
       await bot.sendMessage(msg.chat.id, "got it!");

       bot.sendMessage(msg.chat.id, "Saved!", {
        "reply_markup": {
            "remove_keyboard": true
            }
        });

       item.photo = file_name;
       item.temperature = answerMessage2.text;
       if(!userTemperatures[msg.chat.id].includes(item.temperature))
       {
        userTemperatures[msg.chat.id].push(item.temperature);
       }
       item.color = answerMessage3.text;
       if(!userColors[msg.chat.id].includes(item.color))
       {
        userColors[msg.chat.id].push(item.color);
       }
       item.tumble = answerMessage4.text;
       if(!userTumble[msg.chat.id].includes(item.tumble))
       {
        userTumble[msg.chat.id].push(item.tumble);
       }
       item.additional = answerMessage5.text;
       if(!userdAdditional[msg.chat.id].includes(item.additional))
       {
        userdAdditional[msg.chat.id].push(item.additional);
       }

       userData[msg.chat.id].push(item);



}); 


bot.on('document',
    (msg) => {
        bot.sendMessage(msg.chat.id, "Try to send compressed photo instead.")
}); 



bot.onText(/Wash/, 
    async (msg, match) => 
    {
        console.log(userData);
        var colors = userColors[msg.chat.id].map(elem=>elem.toLowerCase());

        var temperatures = userTemperatures[msg.chat.id].map(elem=>elem.toLowerCase());

        var tumbles = userTumble[msg.chat.id].map(elem=>elem.toLowerCase());

        var additionals = userdAdditional[msg.chat.id].map(elem=>elem.toLowerCase());

        var color_filter = [];
        var temperature_filter = [];
        var tumble_filter = [];
        var add_filter = [];

        var message = msg.text.toString().toLowerCase().replace(",", "").split(" ");
        
        color_filter = message.filter(word => colors.includes(word));
        console.log(color_filter);
        
        temperature_filter = message.filter(word => temperatures.includes(word));
        console.log(temperature_filter);
        
        tumble_filter = message.filter(word => tumbles.includes(word));
        console.log(tumble_filter);

        add_filter = message.filter(word => additionals.includes(word));
        console.log(add_filter);
            
        var result = userData[msg.chat.id].filter(item=>
            (color_filter.length == 0 || color_filter.includes(item.color.toLowerCase()))
            && 
            (temperature_filter.length == 0 || temperature_filter.includes(item.temperature.toLowerCase()))
            &&
            (tumble_filter.length == 0 || tumble_filter.includes(item.tumble.toLowerCase()))
            &&
            (add_filter.length == 0 || add_filter.includes(item.additional.toLowerCase()))
            );


        console.log(result);
        result.forEach(element => {
            sendImage(msg.chat.id, element);
        });
    });


bot.on('polling_error', (error) => {
    console.log(error.code);
    console.log(error);  // => 'EFATAL'
});
