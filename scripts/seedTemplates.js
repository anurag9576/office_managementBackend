const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DocumentTemplate = require('../models/DocumentTemplate');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding templates...');

    // Only delete templates, not employees
    await DocumentTemplate.deleteMany();

    await DocumentTemplate.create([
      {
        name: 'Experience Letter',
        title: 'Experience Certificate',
        type: 'Experience',
        content: `TO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that {{fullName}} (ID: {{employeeId}}) was employed with our organization as a {{designation}} in the {{department}} department from {{joiningDate}} to {{today}}.\n\nDuring this tenure, we found {{firstName}} to be diligent and hardworking. We wish them all the best for their future endeavors.\n\nBest Regards,\nAdministrative Manager\nHamsa Office Management`,
      },
      {
        name: 'NOC Letter',
        title: 'No Objection Certificate',
        type: 'NOC',
        content: `NO OBJECTION CERTIFICATE\n\nDate: {{today}}\n\nThis is to certify that we have no objection to {{fullName}} (Employee ID: {{employeeId}}), who is currently working as a {{designation}} in our company, pursuing their request for higher studies/external projects.\n\nWe wish them success.\n\nAuthorized Signatory,\nHamsa Office Management`,
      }
    ]);

    console.log('Document templates seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedTemplates();
