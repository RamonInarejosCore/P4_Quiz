
const model = require('./model');

const {log, biglog, errorlog, colorize} = require("./out");



/**
 *Muestra la ayuda.
 *@param rl Objeto readLine usado para implementar el CLI.
 */


exports.helpCmd = rl => {

      log("Commandos:");
      log(" h|help - Muestra esta ayuda.");
      log(" list - Listar los quizzes existentes.");
      log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
      log(" add - Añadir un nuevo quiz interactivamente.");
      log(" delete <id> - Borrar el quiz indicado.");
      log(" edit <id> - Editar el quiz indicado.");
      log(" test <id> - Probar el quiz indicado.");
      log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
      log(" credits - Créditos.");
      log(" q|quit - Salir del programa.");
      rl.prompt();

};

/*
 *Terminar el programa.
 *
 *@param rl Objeto readLine usado para implementar el CLI.
 */
exports.quitCmd = rl => {

     rl.close();
     rl.prompt();
};

/*
 *Añade un nuevo quiz al modelo.
 *Pregunta interactivamente por la pregunta y por la respuesta.
 *
 *Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 *El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 *es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 *llamada a rl.question.
 *
 *@param rl Objeto readLine usado para implementar el CLI.
 */


exports.addCmd = rl => {

  rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
    
    rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
   
       model.add(question, answer);
       log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
       rl.prompt();
    });
 });
};

/*
 *Lista todos los quizzes existentes en el modelo.
 *
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.listCmd = rl => {

    
    model.getAll().forEach((quiz, id) => {
 
    log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);  
    });
       
    rl.prompt();
 };

/*
 *Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 *@param id Clave del quiz a mostrar.
 *@param rl Objeto readLine usado para implementar el CLI.
 */


exports.showCmd = (rl,id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch(error) {
              errorlog(error.message);
         }
       }
    rl.prompt();
};

/*
 *Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 *@param id Clave del quiz a probar.
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.testCmd = (rl,id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            rl.question(`${colorize( quiz.question, 'red')}${colorize('? ', 'red')}`, respuesta => {
              
               const resp = quiz.answer;

               if (respuesta.trim().toLowerCase() === resp.trim().toLowerCase()) {
                  log('Su respuesta es correcta.') 
                  biglog("Correcta", "green")
                  rl.prompt();

               }else{
                  
                  log('Su respuesta es incorrecta.');
                  biglog("Incorrecta", "red")
                  rl.prompt();

                }
              
            });
        } catch(error) {
              errorlog(error.message);
         }
       }
    rl.prompt();

    
};

/*
 *Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 *Se gana si se contesta a todos satisfactoriamente.
 *
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.playCmd = rl => {

let score = 0;

let capacidadTamaño = model.count();

let toBeResolved = new Array(capacidadTamaño);



for (var i = 0; i< capacidadTamaño ;i++) {



  for ( var j = 0; j< capacidadTamaño; j++) {

        toBeResolved[j] = j;

  }

  const playOne = () => {

          if(toBeResolved.length <= 0) {



               log("No hay nada más que preguntar");

               log(`Fin del juego. Aciertos: ${score}`);

               biglog(`${score}`, "blue");

               rl.prompt();

          } else {

               try {

                   

                   let aleat = Math.floor(Math.random()*(toBeResolved.length));

                   let id = toBeResolved[aleat];

                   let quiz = model.getByIndex(id);

                   

                   rl.question(`${colorize( quiz.question, 'red')}${colorize('? ', 'red')}`, respuesta => {

                      const resp = quiz.answer;

                      if (respuesta.trim().toLowerCase() === resp.trim().toLowerCase()){
                        
                        toBeResolved.splice(aleat,1);

                         score++;

                         log(`CORRECTO - Lleva ${score} aciertos`)

                         playOne();

                      }else {

                            log('INCORRECTO')

                            log(`Fin del juego. Aciertos: ${score}`);

                            biglog(`${score}`, "blue");

                            rl.prompt();

                        }

                    });

               }catch(error){

                     errorlog(error.message);

                     rl.prompt();

               }

          }

     }

     playOne();

  }

};

                      

        

                  

    

                      

/*
 *Borra un quiz del modelo.
 *
 *@param id Clave del quiz a borrar en el modelo.
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.deleteCmd = (rl,id) => {

  if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
            
        } catch(error) {
              errorlog(error.message);
         }
       }
  


  rl.prompt();
};

/*
 *Edita un quiz del modelo.
 *
 *@param id Clave del quiz a editar en el modelo.
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.editCmd = (rl,id) => {

  if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
  } else {
      try {
         
          const quiz = model.getByIndex(id);
          process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

          rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
 
             process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
             
             rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
                model.update(id, question, answer);
                log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize(' => ', 'magenta')} ${answer}`);
                rl.prompt();
              });
          });
     } catch(error){
             errorlog(error.message);
             rl.prompt();
      }
   }
};

/*
 *Muestra los nombres de los autores de la práctica.
 *
 *@param rl Objeto readLine usado para implementar el CLI.
 */
exports.creditsCmd = rl => {

  log('Autor de la práctica:');
  log('RAMON', 'green');
  rl.prompt();
};

