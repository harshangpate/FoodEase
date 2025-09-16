import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import inquirer from "inquirer";
import chalk from "chalk";
import 'dotenv/config';
import ora from "ora";

// Connect to database
const connectDB = async () => {
  const spinner = ora('Connecting to database...').start();
  try {
    await mongoose.connect('mongodb://localhost:27017/FoodEase');
    spinner.succeed(chalk.green('Connected to FoodEase database'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Database connection failed'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// Find user by email
const findUserByEmail = async () => {
  const { email } = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter user email to search:',
      validate: (input) => {
        if (!input) return 'Email is required';
        return true;
      }
    }
  ]);
  
  const spinner = ora(`Searching for user with email: ${email}...`).start();
  
  try {
    const user = await userModel.findOne({ email });
    
    if (user) {
      spinner.succeed(chalk.green('User found'));
      console.log(chalk.cyan('User Details:'));
      console.log(chalk.cyan('ID:'), user._id);
      console.log(chalk.cyan('Name:'), user.name);
      console.log(chalk.cyan('Email:'), user.email);
      console.log(chalk.cyan('Parent Email:'), user.parentEmail || 'Not provided');
      console.log(chalk.cyan('Is Admin:'), user.isAdmin ? 'Yes' : 'No');
      console.log(chalk.cyan('Used Promocodes:'), user.usedPromocodes.length);
      return user;
    } else {
      spinner.info(chalk.yellow('No user found with that email'));
      return null;
    }
  } catch (error) {
    spinner.fail(chalk.red('Error finding user'));
    console.error(chalk.red('Error:'), error.message);
    return null;
  }
};

// Create new regular user
const createUser = async () => {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Create a new user?',
      default: true
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.yellow('User creation cancelled'));
    return false;
  }
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter user name:',
      validate: (input) => {
        if (!input) return 'Name is required';
        return true;
      }
    },
    {
      type: 'input',
      name: 'email',
      message: 'Enter user email:',
      validate: (input) => {
        if (!input) return 'Email is required';
        if (!input.includes('@')) return 'Please enter a valid email';
        return true;
      }
    },
    {
      type: 'input',
      name: 'parentEmail',
      message: 'Enter parent email (optional):',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter user password:',
      validate: (input) => {
        if (!input) return 'Password is required';
        if (input.length < 8) return 'Password must be at least 8 characters';
        return true;
      }
    }
  ]);
  
  const spinner = ora('Creating user account...').start();
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(answers.password, salt);
    
    const newUser = new userModel({
      name: answers.name,
      email: answers.email,
      parentEmail: answers.parentEmail || null,
      password: hashedPassword,
      isAdmin: false
    });
    
    await newUser.save();
    spinner.succeed(chalk.green('User created successfully!'));
    console.log(chalk.cyan('User Details:'));
    console.log(chalk.cyan('Name:'), answers.name);
    console.log(chalk.cyan('Email:'), answers.email);
    console.log(chalk.cyan('Parent Email:'), answers.parentEmail || 'Not provided');
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Failed to create user'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// Delete user by email
const deleteUser = async () => {
  const { email } = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter email of user to delete:',
      validate: (input) => {
        if (!input) return 'Email is required';
        return true;
      }
    }
  ]);
  
  const spinner = ora(`Searching for user with email: ${email}...`).start();
  
  try {
    const user = await userModel.findOne({ email });
    
    if (!user) {
      spinner.fail(chalk.red('No user found with that email'));
      return false;
    }
    
    spinner.text = `Found user: ${user.name}. Checking if admin...`;
    
    if (user.isAdmin) {
      spinner.fail(chalk.red('Cannot delete an admin user with this tool. Use admin-manager.js instead.'));
      return false;
    }
    
    spinner.text = 'Confirming deletion...';
    spinner.stop();
    
    const { confirmDelete } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete user ${user.name} (${user.email})?`,
        default: false
      }
    ]);
    
    if (!confirmDelete) {
      console.log(chalk.yellow('User deletion cancelled'));
      return false;
    }
    
    spinner.text = 'Deleting user...';
    spinner.start();
    
    await userModel.deleteOne({ _id: user._id });
    
    spinner.succeed(chalk.green('User deleted successfully'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Error deleting user'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// Update user information
const updateUser = async () => {
  // First find the user
  const user = await findUserByEmail();
  
  if (!user) {
    return false;
  }
  
  console.log(chalk.cyan('\nUpdate User Information'));
  console.log(chalk.cyan('─'.repeat(50)));
  
  const { field } = await inquirer.prompt([
    {
      type: 'list',
      name: 'field',
      message: 'Select field to update:',
      choices: [
        { name: 'Name', value: 'name' },
        { name: 'Email', value: 'email' },
        { name: 'Parent Email', value: 'parentEmail' },
        { name: 'Password', value: 'password' },
        { name: 'Cancel', value: 'cancel' }
      ]
    }
  ]);
  
  if (field === 'cancel') {
    console.log(chalk.yellow('Update cancelled'));
    return false;
  }
  
  let value;
  
  if (field === 'password') {
    const { newPassword } = await inquirer.prompt([
      {
        type: 'password',
        name: 'newPassword',
        message: 'Enter new password:',
        validate: (input) => {
          if (!input) return 'Password is required';
          if (input.length < 8) return 'Password must be at least 8 characters';
          return true;
        }
      }
    ]);
    
    const salt = await bcrypt.genSalt(10);
    value = await bcrypt.hash(newPassword, salt);
  } else {
    const { newValue } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newValue',
        message: `Enter new ${field}:`,
        default: user[field] || '',
        validate: (input) => {
          if (field === 'email' && !input.includes('@')) return 'Please enter a valid email';
          if (field === 'parentEmail' && input && !input.includes('@')) return 'Please enter a valid email';
          return true;
        }
      }
    ]);
    
    value = newValue;
  }
  
  const spinner = ora(`Updating user ${field}...`).start();
  
  try {
    await userModel.updateOne({ _id: user._id }, { [field]: value });
    spinner.succeed(chalk.green(`User ${field} updated successfully`));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`Failed to update user ${field}`));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// List all regular (non-admin) users
const listAllRegularUsers = async () => {
  const spinner = ora('Fetching all regular users...').start();
  
  try {
    const allUsers = await userModel.find({ isAdmin: false });
    spinner.succeed(chalk.green(`Found ${allUsers.length} regular users`));
    
    console.log(chalk.cyan('\nAll Regular Users in Database:'));
    console.log(chalk.cyan('─'.repeat(80)));
    console.log(chalk.cyan('Name'.padEnd(20) + 'Email'.padEnd(30) + 'Parent Email'.padEnd(30)));
    console.log(chalk.cyan('─'.repeat(80)));
    
    allUsers.forEach(user => {
      console.log(
        user.name.padEnd(20) + 
        user.email.padEnd(30) + 
        (user.parentEmail || 'Not provided').padEnd(30)
      );
    });
    
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch users'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// List users with no parent email
const listUsersWithNoParentEmail = async () => {
  const spinner = ora('Fetching users with no parent email...').start();
  
  try {
    const users = await userModel.find({
      isAdmin: false,
      $or: [
        { parentEmail: { $exists: false } },
        { parentEmail: null },
        { parentEmail: '' }
      ]
    });
    
    spinner.succeed(chalk.green(`Found ${users.length} users with no parent email`));
    
    if (users.length === 0) {
      console.log(chalk.green('All users have parent emails set!'));
      return true;
    }
    
    console.log(chalk.cyan('\nUsers with No Parent Email:'));
    console.log(chalk.cyan('─'.repeat(50)));
    console.log(chalk.cyan('Name'.padEnd(20) + 'Email'.padEnd(30)));
    console.log(chalk.cyan('─'.repeat(50)));
    
    users.forEach(user => {
      console.log(
        user.name.padEnd(20) + 
        user.email.padEnd(30)
      );
    });
    
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch users'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// Main menu function
const mainMenu = async () => {
  const { option } = await inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Select an option:',
      choices: [
        { name: 'Find user by email', value: '1' },
        { name: 'Create new user', value: '2' },
        { name: 'Update user information', value: '3' },
        { name: 'Delete user', value: '4' },
        { name: 'List all regular users', value: '5' },
        { name: 'List users with no parent email', value: '6' },
        { name: 'Exit', value: '7' }
      ]
    }
  ]);
  
  switch (option) {
    case '1':
      await findUserByEmail();
      return mainMenu();
    case '2':
      await createUser();
      return mainMenu();
    case '3':
      await updateUser();
      return mainMenu();
    case '4':
      await deleteUser();
      return mainMenu();
    case '5':
      await listAllRegularUsers();
      return mainMenu();
    case '6':
      await listUsersWithNoParentEmail();
      return mainMenu();
    case '7':
      console.log(chalk.green('Goodbye!'));
      process.exit(0);
  }
};

// Main function
const main = async () => {
  console.log(chalk.cyan.bold('\nFoodEase User Management Tool'));
  
  const connected = await connectDB();
  if (!connected) {
    console.log(chalk.red('Exiting due to database connection failure'));
    process.exit(1);
  }
  
  await mainMenu();
};

// Start the application
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});