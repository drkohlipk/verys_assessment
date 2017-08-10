#!/usr/bin/env node

'use strict';

const fetch = require('node-fetch'),
	readline = require('readline'),
	cliff = require('cliff');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

/* Start Global Variables */

var users = [],
	selectedUser = {},
	selectedPost = {},
	userPosts = [],
	userAlbums = 0,
	userTodos = 0,
	postComments = [];

/* End Global Variables */

/**
 * Clears terminal window
 */
const clearScreen = () => {
	process.stdout.write("\x1B[2J");
};

/**
 * Retrieves all users from API
 */
const getUsers = () => {
	fetch('https://jsonplaceholder.typicode.com/users')
		.then(res => {
			return res.json();
		}).then(body => {
			users = body;
			showUsers();
			return;
		}).catch(err => {
			console.log(err);
			throw new Error("I'm sorry, we were unable to process your request at this time, please try again later.");
		});
};

/**
 * Retrieves relevant information for the selected user
 * 
 * @param  {number} id - ID correlating to a user
 */
const getUserData = async id => {
	let count = 0;

	await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${id}`)
		.then(res => {
			return res.json();
		}).then(body => {
			userPosts = body;
		}).catch(err => {
			console.log(err);
			throw new Error("I'm sorry, we were unable to process your request at this time, please try again later.");
		});

	await fetch(`https://jsonplaceholder.typicode.com/albums?userId=${id}`)
		.then(res => {
			return res.json();
		}).then(body => {
			userAlbums = body.length;
		}).catch(err => {
			console.log(err);
			throw new Error("I'm sorry, we were unable to process your request at this time, please try again later.");
		});

	await fetch(`https://jsonplaceholder.typicode.com/todos?userId=${id}`)
		.then(res => {
			return res.json();
		}).then(body => {
			userTodos = body.length;
		}).catch(err => {
			console.log(err);
			throw new Error("I'm sorry, we were unable to process your request at this time, please try again later.");
		});

	showUserInfo();
};

/**
 * Retrieves all comments for a specified post
 * 
 * @param  {number} id - ID Corresponding to a post
 */
const getPostComments = id => {
	fetch(`https://jsonplaceholder.typicode.com/posts/${id}/comments`)
		.then(res => {
			return res.json();
		}).then(body => {
			postComments = body;
			showPostInfo();
		}).catch(err => {
			console.log(err);
			throw new Error("I'm sorry, we were unable to process your request at this time, please try again later.");
		});
};

/**
 * Prints a formatted list of all current users
 */
const showUsers = () => {
	clearScreen();
	console.log("Below is a list of all users:");

	let userArr = [];

	for (let i = 0; i < users.length; i++) {
		userArr.push({
			ID: i + 1,
			Name: users[i].name,
			Username: users[i].username
		});
	}

	console.log(cliff.stringifyObjectRows(userArr, ['ID', 'Name', 'Username']));

	askForInput(useInput, 'user');
};

/**
 * Prints a user's information
 */
const showUserInfo = () => {
	clearScreen();
	console.log(`${selectedUser.name} has ${userPosts.length} posts, ${userAlbums} albums, and ${userTodos} todos.`);

	let postArr = [];

	for (let i = 0; i < 5; i++) {
		postArr.push({
			ID: i + 1,
			Post: userPosts[i].title
		});
	}

	console.log(cliff.stringifyObjectRows(postArr, ['ID', 'Post']));

	askForInput(useInput, 'post');
};

/**
 * Prints a post's information
 */
const showPostInfo = () => {
	clearScreen();
	console.log(`Viewing post "${selectedPost.title}" which has ${postComments.length} comments.\n`);
	console.log(`Post: "${selectedPost.body}".\n`);

	let postArr = [];

	for (let i = 0; i < postComments.length; i++) {
		console.log(`- ${postComments[i].email} said ${postComments[i].body}.`)
	}

	console.log("\n");
	askForInput(useInput, 'comment');
};

/**
 * Asks a user for input based on their current level of fidelity.
 * Checks input based on level and calls cb.
 * 
 * @param  {function} cb - Callback to make use of entered information
 * @param  {string} level - Current level of fidelity (user, post, comment)
 */
const askForInput = (cb, level) => {
	let message = "Enter an ID to see information or 'e' to exit: ";

	if (level == 'user') {
		message = "Enter an ID to see user information or 'e' to exit: ";
	} else if (level == 'post') {
		message = "Enter an ID to see post information, 'b' to go back, or 'e' to exit: ";
	} else if (level == 'comment') {
		message = "Enter 'c' to leave a comment, 'b' to go back, or 'e' to exit: ";
	}

	rl.question(message, answer => {
		if (!checkInput(answer, level)) {
			askForInput(cb, level)
		} else {
			cb(answer, level);
		}
	});
};

/**
 * Allows user to leave a comment
 */
const leaveComment = () => {
	let commentObj = {
		postId: selectedPost.id,
		id: postComments.length + 1
	};

	rl.question("Enter your email: ", email => {
		commentObj.email = email;

		rl.question("Enter the title of your comment: ", name => {
			commentObj.name = name;

			rl.question("Enter your comment: ", comment => {
				commentObj.body = comment;

				postComments.push(commentObj);

                showPostInfo();
			});
		});
	});
};

/**
 * Validates the user's input based on level of fidelity.
 * 
 * @param  {string} input - Input received from askForInput
 * @param  {string} level - Current level of fidelity (user, post, comment) 
 * 
 * @returns  {boolean}
 */
const checkInput = (input, level) => {
	let re = level == 'comment' ? /[cbe]/i : /[1234567890be]/i;
	let max = level == 'user' ? 10 : 5;

	if (!re.test(input)) {
		console.log("Please enter a valid input.");
		return false;
	} else if (input <= 0 || input > max) {
		console.log(`Please enter a number between 1 and ${max}.`);
		return false;
	} else {
		return true;
	}
};

/**
 * Processes user input.
 * 
 * @param  {string} input
 * @param  {string} level
 */
const useInput = (input, level) => {
	if (input.toLowerCase() == 'e') {
		process.exit(0);
	} else if (input.toLowerCase() == 'c' && level == 'comment') {
		leaveComment();
	} else if (input.toLowerCase() == 'b') {
		showUsers();
	} else {
		switch (level) {
			case 'post':
				selectedPost = userPosts[input - 1];
				getPostComments(input);
				break;
			case 'user':
				selectedUser = users[input - 1];
				getUserData(input);
				break;
			default:
				showUsers();
				break;
		}
	}
};

getUsers();