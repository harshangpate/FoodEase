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
    // Use environment variable for MongoDB URI or fallback to local DB for development
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/FoodEase';
    await mongoose.connect(mongoURI);
    spinner.succeed(chalk.green(`Connected to ${mongoURI.includes("localhost") ? "local" : "Atlas"} database`));
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Database connection failed'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// Check if admin exists
const checkAdmin = async () => {
  const spinner = ora('Checking for existing admin accounts...').start();
  try {
    const adminExists = await userModel.findOne({ isAdmin: true });
    
    if (adminExists) {
      spinner.succeed(chalk.green('Admin account found'));
      console.log(chalk.cyan('Admin Details:'));
      console.log(chalk.cyan('Name:'), adminExists.name);
      console.log(chalk.cyan('Email:'), adminExists.email);
      console.log(chalk.cyan('Is Admin:'), adminExists.isAdmin ? 'Yes' : 'No');
      return true;
    } else {
      spinner.info(chalk.yellow('No admin accounts found'));
      return false;
    }
  } catch (error) {
    spinner.fail(chalk.red('Error checking admin accounts'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// Create new admin
const createAdmin = async () => {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Create a new admin?',
      default: true
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.yellow('Admin creation cancelled'));
    return false;
  }
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter admin name:',
      default: 'Admin'
    },
    {
      type: 'input',
      name: 'email',
      message: 'Enter admin email:',
      default: 'admin@foodease.com'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter admin password:',
      default: 'admin123'
    }
  ]);
  
  const spinner = ora('Creating admin account...').start();
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(answers.password, salt);
    
    const newAdmin = new userModel({
      name: answers.name,
      email: answers.email,
      password: hashedPassword,
      isAdmin: true
    });
    
    await newAdmin.save();
    spinner.succeed(chalk.green('Admin created successfully!'));
    console.log(chalk.cyan('Admin Details:'));
    console.log(chalk.cyan('Name:'), answers.name);
    console.log(chalk.cyan('Email:'), answers.email);
    console.log(chalk.cyan('Password:'), answers.password);
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Failed to create admin'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// Reset admin accounts
const resetAdmin = async () => {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '⚠️ This will delete all existing admin accounts. Continue?',
      default: false
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.yellow('Admin reset cancelled'));
    return false;
  }
  
  const spinner = ora('Resetting admin accounts...').start();
  
  try {
    await userModel.deleteMany({ isAdmin: true });
    spinner.succeed(chalk.green('All admin accounts removed'));
    
    const { createNew } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createNew',
        message: 'Create a new admin?',
        default: true
      }
    ]);
    
    if (createNew) {
      spinner.stop();
      await createAdmin();
    } else {
      console.log(chalk.yellow('No new admin created'));
    }
    
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Failed to reset admin accounts'));
    console.error(chalk.red('Error:'), error.message);
    return false;
  }
};

// List all users
const listAllUsers = async () => {
  const spinner = ora('Fetching all users...').start();
  
  try {
    const allUsers = await userModel.find({});
    spinner.succeed(chalk.green(`Found ${allUsers.length} users`));
    
    console.log(chalk.cyan('\nAll Users in Database:'));
    console.log(chalk.cyan('─'.repeat(50)));
    console.log(chalk.cyan('Name'.padEnd(20) + 'Email'.padEnd(25) + 'Admin'));
    console.log(chalk.cyan('─'.repeat(50)));
    
    allUsers.forEach(user => {
      console.log(
        user.name.padEnd(20) + 
        user.email.padEnd(25) + 
        (user.isAdmin ? chalk.green('Yes') : 'No')
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
        { name: 'Check existing admin accounts', value: '1' },
        { name: 'Create new admin account', value: '2' },
        { name: 'Reset admin accounts', value: '3' },
        { name: 'List all users', value: '4' },
        { name: 'Exit', value: '5' }
      ]
    }
  ]);
  
  switch (option) {
    case '1':
      await checkAdmin();
      return mainMenu();
    case '2':
      await createAdmin();
      return mainMenu();
    case '3':
      await resetAdmin();
      return mainMenu();
    case '4':
      await listAllUsers();
      return mainMenu();
    case '5':
      console.log(chalk.green('Goodbye!'));
      process.exit(0);
  }
};

// Main function
const main = async () => {
  console.log(chalk.cyan.bold('\nFoodEase Admin Management Tool'));
  
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