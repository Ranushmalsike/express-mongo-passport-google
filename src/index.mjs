import express from "express";
import connectDB from "./db/db.mjs";
import cookieParser from "cookie-parser"; 
import session from "express-session";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import user from "./schema/schema.mjs";
import { uservalidation, validateUserView } from "./validator/validator.mjs"; // Import the User model
import { body, checkSchema, validationResult, matchedData} from "express-validator";
import { setBcryptvalues } from "./Hashing /hash.mjs";
// import { Passport } from "passport";
import passport  from "./strategy/google-strategy.mjs";


dotenv.config({ path: './.env' });

const PORT = 3000;
const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({extended : false}));

// session section
app.use(cookieParser("holloWorld"));
app.use(
    session({
        secret: "abc the dev",
        saveUninitialized: false,
        resave: false,
        cookie:{
            maxAge: 60000 * 60,
        },
        // think server sometime restart then occur the problem for session. then idea when server restarted need to create new session it difficult to
        // - client. because provide solution for it. If server restarted no occur the problem by bellow section. no need to create new session and again.
        //- first time save session in database. it's most important matter for client. and this for library is connect-mongo but as this have main library
        // - there can be use mysql and redis and more different db or cache save the session. 
        store: MongoStore.create({
            client: mongoose.connection.getClient()
        }),
    })
);

  // app.use(Passport.initialize());
  // app.use(Passport.session());

app.get('/', (req, res) => {
    console.log(req.session);
    console.log(req.session.id);
    // this line use for prevent the modify session id once time
    req.session.visited = true;
    
   res.cookie('hello', "World", { maxAge: 100000, signed: true });
});

// google auth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/redirect', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// Input values into database
app.post('/user/api', checkSchema(uservalidation), async (req, res) => {
  const requestvalide = validationResult(req);
  if(!requestvalide) return res.status(400).send({ error: requestvalide.array().message });
  
  try {
    const { body } = req;
    body.password = setBcryptvalues(body.password);
    const newObjUser = new user(body);
    const saveUser = await newObjUser.save();
    return res.status(200).json(saveUser);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

// Check values available in database
app.post("/user/api/view", validateUserView, async (req, res) => {
  console.log("Request body:", req.body);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  // Return success response
  const matchResult = matchedData(req);
  req.session.user = matchResult;
  return res.status(200).send({ message: "Request successful", data: matchResult });
});


app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        return res.status(200).json(req.session.user);
    } else {
        return res.status(401).json({ msg: "Not Authenticated" });
    }
});


app.listen(PORT, () => console.log(`Server up on port ${PORT}`));
