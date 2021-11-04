// const Realm = require("realm");

// const TaskSchema = {
//   name: "Task",
//   properties: {
//     _id: "int",
//     name: "string",
//     status: "string?",
//   },
//   primaryKey: "_id",
// };

// async function quickStart() {
//   const realm = await Realm.open({
//     path: "myrealm",
//     schema: [TaskSchema],
//   });

//   // Add a couple of Tasks in a single, atomic transaction
//   let task1, task2;
//   realm.write(() => {
//     task1 = realm.create("Task", {
//       _id: 1,
//       name: "go grocery shopping",
//       status: "Open",
//     });

//     task2 = realm.create("Task", {
//       _id: 2,
//       name: "go exercise",
//       status: "Open",
//     });
//     console.log(`created two tasks: ${task1.name} & ${task2.name}`);
//   });
//   // use task1 and task2

//   // query realm for all instances of the "Task" type.
//   const tasks = realm.objects("Task");
//   console.log(`The lists of tasks are: ${tasks.map((task) => task.name)}`);

//   // filter for all tasks with a status of "Open"
//   const openTasks = tasks.filtered("status = 'Open'");
//   console.log(
//     `The lists of open tasks are: ${openTasks.map(
//       (openTask) => openTask.name
//     )}`
//   );

//   // Sort tasks by name in ascending order
//   const tasksByName = tasks.sorted("name");
//   console.log(
//     `The lists of tasks in alphabetical order are: ${tasksByName.map(
//       (taskByName) => taskByName.name
//     )}`
//   );


//   // Define the collection notification listener
//   function listener(tasks, changes) {
//     // Update UI in response to deleted objects
//     changes.deletions.forEach((index) => {
//       // Deleted objects cannot be accessed directly,
//       // but we can update a UI list, etc. knowing the index.
//       console.log(`A task was deleted at the ${index} index`);
//     });
//     // Update UI in response to inserted objects
//     changes.insertions.forEach((index) => {
//       let insertedTasks = tasks[index];
//       console.log(
//         `insertedTasks: ${JSON.stringify(insertedTasks, null, 2)}`
//       );
//       // ...
//     });
//     // Update UI in response to modified objects
//     // `newModifications` contains object indexes from after they were modified
//     changes.newModifications.forEach((index) => {
//       let modifiedTask = tasks[index];
//       console.log(`modifiedTask: ${JSON.stringify(modifiedTask, null, 2)}`);
//       // ...
//     });
//   }
//   // Observe collection notifications.
//   tasks.addListener(listener);

//   realm.write(() => {
//     task1.status = "InProgress";
//   });


//   realm.write(() => {
//     // Delete the task from the realm.
//     realm.delete(task1);
//     // Discard the reference.
//     task1 = null;
//   });


//   // Remember to close the realm
//   realm.close();
// }
// quickStart().catch((error) => {
//   console.log(`An error occurred: ${error}`);
// });

// sync example


const Realm = require("realm");
const BSON = require("bson");

// Update this with your App ID
const app = new Realm.App({ id: "<Your App ID>" });
const TaskSchema = {
  name: "Task",
  properties: {
    _id: "objectId",
    _partition: "string?",
    name: "string",
    status: "string",
  },
  primaryKey: "_id",
};

async function run() {
  const credentials = Realm.Credentials.anonymous();
  await app.logIn(credentials);
  console.log(`Logged in anonymously with user id: ${app.currentUser.id}`);

  const realm = await Realm.open({
    schema: [TaskSchema],
    sync: {
      user: app.currentUser,
      partitionValue: "quickstart",
    },
  });

  // Get all Tasks in the realm
  const tasks = realm.objects("Task");

  // Add a listener that fires whenever one or more Tasks are inserted, modified, or deleted.
  tasks.addListener(taskListener);

  // Add a couple of Tasks in a single, atomic transaction
  // Realm automatically sets the _partition property based on the partitionValue used to open the realm
  realm.write(() => {
    const task1 = realm.create("Task", {
      _id: new BSON.ObjectID(),
      name: "go grocery shopping",
      status: "Open",
    });
    
    const task2 = realm.create("Task", {
      _id: new BSON.ObjectID(),
      name: "go exercise",
      status: "Open",
    });
    console.log(`created two tasks: ${task1.name} & ${task2.name}`);
  });

  // Find a specific Task
  let task = tasks.filtered("status = 'Open' LIMIT(1)")[0];
  console.log("task", JSON.stringify(task, null, 2));

  // Update the Task
  realm.write(() => {
    task.status = "InProgress";
  });

  // Delete the Task
  realm.write(() => {
    realm.delete(task);
    task = null;
  });

  // Clean up
  tasks.removeListener(taskListener);
  realm.close();
  app.currentUser.logOut();
}
run().catch(err => {
  console.error(err)
});

// Define the collection notification listener
function taskListener(tasks, changes) {
  // Update UI in response to deleted objects
  changes.deletions.forEach((index) => {
    // Deleted objects cannot be accessed directly,
    // but we can update a UI list, etc. knowing the index.
    console.log(`- deleted a task -`);
  });

  // Update UI in response to inserted objects
  changes.insertions.forEach((index) => {
    let insertedTask = tasks[index].name;
    console.log(`inserted task: ${JSON.stringify(insertedTask, null, 2)}`);
    // ...
  });

  // Update UI in response to modified objects
  changes.newModifications.forEach((index) => {
    let modifiedTask = tasks[index];
    console.log(`modified task: ${JSON.stringify(modifiedTask, null, 2)}`);
    // ...
  });
}

