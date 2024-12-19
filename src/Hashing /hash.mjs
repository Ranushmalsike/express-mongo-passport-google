import bcrypt from 'bcrypt';

// salt round you can enter any values for this

const saltRound  = 10;

export const setBcryptvalues = (password) =>{
    const mixing = bcrypt.genSaltSync(saltRound);
    return bcrypt.hashSync(password, mixing);
}

export const compareValues = (plain, hashed) => 
    bcrypt.compareSync(plain, hashed);