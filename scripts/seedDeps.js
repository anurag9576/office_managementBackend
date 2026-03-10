const mongoose = require('mongoose');
const Department = require('../models/Department');
const dotenv = require('dotenv');

dotenv.config();

const seedDepartments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Department.countDocuments();
        if (count === 0) {
            await Department.create([
                { name: 'IT Department', description: 'Tech related stuff' },
                { name: 'HR Department', description: 'Human resources' },
                { name: 'Finance', description: 'Money management' },
                { name: 'Design', description: 'Visual design and UI' }
            ]);
            console.log('Departments seeded!');
        } else {
            console.log('Departments already exist.');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedDepartments();
