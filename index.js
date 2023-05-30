require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const PhoneBook = require("./models/phoneBook");

app.use(cors());
app.use(express.static("build"));

app.use(express.json());

morgan.token("body", (req) => {
  return JSON.stringify(req.body);
});

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);

app.get("/api/persons", (request, response) => {
  PhoneBook.find({}).then((persons) => response.json(persons));
});

app.get("/info", (request, response) => {
  response.send(`<div>Phonebook has info for ${PhoneBook.length} people</div>
    <div>${new Date()}</div>
`);
});

app.get("/api/persons/:id", (request, response, next) => {
  PhoneBook.findById(request.params.id)
      .then(
      person => {
        if (person) {
          response.json(person);
        } else {
          response.status(404).end();
        }
      })
      .catch(error => next(error))
  ;
});

app.post("/api/persons", (request, response, next) => {
  const body = request.body;
  if (body.name  === undefined) {
    return response.status(400).json({
      error: "name missing",
    });
  }

  const phoneBook = new PhoneBook({
    name: body.name,
    number: body.number
  });

  phoneBook.save().then(
      phoneBook => response.json(phoneBook)
  ).catch(error => next(error))

});

app.put('/api/persons/:id', (request, response, next) => {
  const person = {
    name: request.body.name,
    number: request.body.number,
  };
  PhoneBook.findByIdAndUpdate(request.params.id, person, { new: true })
      .then((result) => {
        response.json(result);
      })
      .catch((error) => next(error));
});

app.delete("/api/persons/:id", (request, response, next) => {
  PhoneBook.findByIdAndRemove(request.params.id)
      .then(result => response.status(204).end())
      .catch(err => next(err))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }


  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);
