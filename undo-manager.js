
function removeFromTo(array, from, to) {
  array.splice(
    from,
    !to ||
      1 +
        to -
        from +
        (!((to < 0) ^ (from >= 0)) && (to < 0 || -1) * array.length),
  );
  return array.length;
}

let UndoManager = function () {
  let commands = [],
    index = -1,
    limit = 0,
    isExecuting = false,
    callback;
  function execute(command, action) {
    if (!command || typeof command[action] !== 'function') {
      return this;
    }
    isExecuting = true;

    command[action]();

    isExecuting = false;
    return this;
  }
  return {
    add: function (command) {
      if (isExecuting) {
        return this;
      }
      commands.splice(index + 1, commands.length - index);
      commands.push(command);
      if (limit && commands.length > limit) {
        removeFromTo(commands, 0, -(limit + 1));
      }
      index = commands.length - 1;
      if (callback) {
        callback();
      }
      return this;
    },
    setCallback: function (callbackFunc) {
      callback = callbackFunc;
    },
    undo: function () {
      let command = commands[index];
      if (!command) {
        return this;
      }

      const groupId = command.groupId;
      while (command.groupId === groupId) {
        execute(command, 'undo');
        index -= 1;
        command = commands[index];
        if (!command || !command.groupId) break;
      }

      if (callback) {
        callback();
      }
      return this;
    },
    redo: function () {
      let command = commands[index + 1];
      if (!command) {
        return this;
      }

      const groupId = command.groupId;
      while (command.groupId === groupId) {
        execute(command, 'redo');
        index += 1;
        command = commands[index + 1];
        if (!command || !command.groupId) break;
      }

      if (callback) {
        callback();
      }
      return this;
    },
    clear: function () {
      let prev_size = commands.length;

      commands = [];
      index = -1;

      if (callback && prev_size > 0) {
        callback();
      }
    },
    hasUndo: function () {
      return index !== -1;
    },
    hasRedo: function () {
      return index < commands.length - 1;
    },
    getCommands: function (groupId) {
      return groupId ? commands.filter(c => c.groupId === groupId) : commands;
    },
    getIndex: function () {
      return index;
    },
    setLimit: function (max) {
      limit = max;
    },
  };
};

var undoManager = new UndoManager();

undoManager.setCallback(function () { stanpumpDirty=true; });

var undoBeginState;

function undoBegin () {
 undoBeginState = JSON.stringify(stanpumpConfig);
}

function undoEnd() {
  var oldstate = undoBeginState;
  var newstate = JSON.stringify(stanpumpConfig);
  stanpumpDirty=true;
  undoManager.add({
    undo: function () { stanpumpConfig=JSON.parse(oldstate); },
    redo: function () { stanpumpConfig=JSON.parse(newstate); }
  });
}

function undo () { undoManager.undo(); }

function redo () { undoManager.redo(); }

