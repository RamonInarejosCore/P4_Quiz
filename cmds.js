

const {models} = require('./model');

const {log, biglog, errorlog, colorize} = require("./out");

const Sequelize = require('sequelize');



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

  makeQuestion(rl, ' Introduzca una pregunta: ')
  .then(q => {
     return makeQuestion(rl, ' Introduzca la respuesta ')
     .then(a => {
        return {question: q, answer: a};
     });
   })
  .then(quiz => {
    return models.quiz.create(quiz);
   })
  .then((quiz) => {
    log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
   })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo:');
    error.errors.forEach(({message}) => errorlog(message));
  })
 .catch(error => {
    errorlog(error.message);
  })
 .then(() => {
    rl.prompt();
  });

};

/*
 *Lista todos los quizzes existentes en el modelo.
 *
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.listCmd = rl => {

    
    models.quiz.findAll()
    .then(quizzes => {
        quizzes.forEach(quiz => {
          log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        });
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 *Esta función devuelve una promesa que :
 * -Valida se ha introducido un valor para el parámetro.
 * -Convierte el parámetro en un numero entero.
 *Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 *
 *@param id Parámetro con el índice a validar.
 */
const validateId = id => {

    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
          reject(new Error(`Falta el parametro <id>.`));
        }else {
          id = parseInt(id); //coger la parte entera y descartar lo decimal.
          if(Number.isNaN(id)) {
              reject(new Error(`El valor del parámetro <id> no es un número .`));
         }else {
              resolve(id);
         }
       }
    });
};


/*
 *Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 *@param id Clave del quiz a mostrar.
 *@param rl Objeto readLine usado para implementar el CLI.
 */


exports.showCmd = (rl,id) => {

    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

    })
    .catch(error => {
       errorlog(error.message);
    })
    .then(() => {
       rl.prompt();
    });

};

/**
 *Esta función convierte la llamada rl.questio, que está basada en callbacks, en una 
 *basada en promesas.
 *
 *    .then(answer => {...})
 *
 *También colorea en rojo el texto de la pregunta, elimina espacios al principioy final.
 *
 *@param rl Objeto readline usado para implementar el CLI.
 *@param text Pregunta que hay que hacerle al usuario.
 */
const makeQuestion = (rl, text) => {

     return new Sequelize.Promise((resolve,reject) => {
       rl.question(colorize(text, 'red'), answer => {
          resolve(answer.trim());
       });
     });
};

/*
 *Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 *@param id Clave del quiz a probar.
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.testCmd = (rl,id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz=>{
            if(!quiz){
                throw  new Error(`No existe un quiz asociado al id=${id}.`)
            }
            return makeQuestion(rl,`${quiz.question} ? `)
                .then(a => {
                    let respuesta = a.trim().toLowerCase()
                    let resp  =quiz.answer;
                    if(respuesta !== resp.trim().toLowerCase()) {
                        log('Su respuesta es incorrecta.'),
                            biglog("Incorrecta", "red")

                    }else {
                        return log('Su respuesta es correcta.'),
                            biglog("Correcta", "green")

                    }
                });
        })

        .catch(error=>{
                 errorlog(error.message);
        })
        .then(()=>{
                 rl.prompt();
        });


};

           

/*
 *Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 *Se gana si se contesta a todos satisfactoriamente.
 *
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.playCmd = rl => {

var cuenta = 1;
	var toBeResolved = [];
	var score = 0;
	models.quiz.findAll()
    .each(quiz => {
		toBeResolved[cuenta-1] = cuenta;
		cuenta = cuenta +1 ;
    })
    .then(() => {
	    const playOne = ()=> {
			if ( toBeResolved.length == 0){
				log("No hay nada más que preguntar.");
				log(`Fin del juego. Aciertos: ${score}`),
				biglog(score, 'blue');
				rl.prompt();
			}else{
				let rand = Math.trunc(Math.random()*toBeResolved.length);
				let id = toBeResolved[rand];
				validateId(id)
				.then(id => models.quiz.findById(id))
				.then(quiz => {
					pregunta = quiz.question;
					makeQuestion(rl, pregunta + '?')
					.then(a => {
						console.log(a);
						if ( a.toLocaleLowerCase() === quiz.answer.toLocaleLowerCase()){
							score++;
							log(`CORRECTO - Lleva ${score} aciertos.`); 
							toBeResolved.splice(rand,1);
							playOne();
						}else{
							log('INCORRECTO.');
							log(`Fin del juego. Aciertos: ${score}`);
							biglog(score,'yellow');
							rl.prompt();
						}
					});
				})
				.catch(error => {
					errorlog(error.message);
				})
				.then(() => {
					rl.prompt();
				});
			}
	    }
	    playOne();
    });    
};
                                   
                        
                        

                      

        

                  

    

                      

/*
 *Borra un quiz del modelo.
 *
 *@param id Clave del quiz a borrar en el modelo.
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.deleteCmd = (rl,id) => {

  validateId(id)
 .then(id => models.quiz.destroy({where: {id}}))
 .catch(error => {
   errorlog(error.message);
 })
 .then(() => {
  rl.prompt();
 });
};

/*
 *Edita un quiz del modelo.
 *
 *@param id Clave del quiz a editar en el modelo.
 *@param rl Objeto readLine usado para implementar el CLI.
 */

exports.editCmd = (rl,id) => {

        validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
             if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
             }
        
             process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
             return makeQuestion(rl, ' Introduzca una pregunta: ')
             .then(q => {
                 process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                 return makeQuestion(rl, ' Introduzca la respuesta: ')
                 .then(a => {
                      
                          quiz.question = q;
                          quiz.answer = a;
                          return quiz;
                  });
              });
        })
       .then(quiz => {
             return quiz.save();
        })
       .then(quiz => {
            log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize(' => ', 'magenta')} ${quiz.answer}`);
             
        })
       .catch(Sequelize.ValidationError, error => {
             errorlog('El quiz es erroneo:');
             error.errors.forEach(({message}) => errorlog(message));
        })
       .catch(error => {
            errorlog(error.message);
        })
       .then(() => {
            rl.prompt();
        });

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

