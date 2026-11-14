import sequelize from '../config/db.js';
import { User } from '../models/index.js';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run db:promote-admin -- <email>');
  process.exitCode = 1;
} else {
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exitCode = 1;
    } else {
      await user.update({ isAdmin: true, isActive: true });
      console.log(`${user.email} is now an active administrator.`);
    }
  } catch (error) {
    console.error('Failed to promote administrator:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
