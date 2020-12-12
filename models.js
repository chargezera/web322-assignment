const Sequelize = require("sequelize");
const sequelize = new Sequelize(process.env.DATABASE_URL);

var User = sequelize.define('User', {
    type: Sequelize.STRING,
    fName: Sequelize.STRING,
    lName: Sequelize.STRING,
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    pass: Sequelize.STRING,
});

var Room = sequelize.define('Room', {
    title: Sequelize.STRING,
    description: Sequelize.STRING,
    location: Sequelize.STRING,
    price: Sequelize.FLOAT,
    photoname: Sequelize.STRING
});

sequelize.sync();
module.exports = { User: User, Room: Room }