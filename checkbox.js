var Checkbox, Task, Tasks;

Checkbox = (function() {

  function Checkbox(dbClient, root) {
    var _this = this;
    this.dbClient = dbClient;
    this.root = root;
    this.$root = $(this.root);
    this.taskTemplate = $('#task-template').html().trim();
    this.$activeList = $('#active-task-list', this.$root);
    this.$doneList = $('#done-task-list', this.$root);
    $('#signout-button').click(function(event) {
      return _this.onSignOut(event);
    });
    this.dbClient.authenticate(function(error, data) {
      if (error) {
        return _this.showError(error);
      }
      _this.dbClient.getUserInfo(function(error, userInfo) {
        if (error) {
          return _this.showError(error);
        }
        return $('#user-name', _this.$root).text(userInfo.name);
      });
      _this.tasks = new Tasks(_this, _this.dbClient);
      return _this.tasks.load(function() {
        _this.wire();
        _this.render();
        return _this.$root.removeClass('hidden');
      });
    });
  }

  Checkbox.prototype.render = function() {
    var task, _i, _j, _len, _len1, _ref, _ref1, _results;
    this.$activeList.empty();
    this.$doneList.empty();
    _ref = this.tasks.active;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      task = _ref[_i];
      this.renderTask(task);
    }
    _ref1 = this.tasks.done;
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      task = _ref1[_j];
      _results.push(this.renderTask(task));
    }
    return _results;
  };

  Checkbox.prototype.renderTask = function(task) {
    var $list;
    $list = task.done ? this.$doneList : this.$activeList;
    return $list.append(this.$taskDom(task));
  };

  Checkbox.prototype.$taskDom = function(task) {
    var $task,
      _this = this;
    $task = $(this.taskTemplate);
    $('.task-name', $task).text(task.name);
    $('.task-remove-button', $task).click(function(event) {
      return _this.onRemoveTask(event, task);
    });
    if (task.done) {
      $('.task-done-button', $task).addClass('hidden');
      $('.task-active-button', $task).click(function(event) {
        return _this.onActiveTask(event, task);
      });
    } else {
      $('.task-active-button', $task).addClass('hidden');
      $('.task-done-button', $task).click(function(event) {
        return _this.onDoneTask(event, task);
      });
    }
    return $task;
  };

  Checkbox.prototype.onNewTask = function(event) {
    var name, task,
      _this = this;
    event.preventDefault();
    name = $('#new-task-name').val();
    if (this.tasks.findByName(name)) {
      return alert("You already have this task on your list!");
    } else {
      $('#new-task-button').attr('disabled', 'disabled');
      $('#new-task-name').attr('disabled', 'disabled');
      task = new Task();
      task.name = name;
      return this.tasks.addTask(task, function() {
        $('#new-task-name').removeAttr('disabled').val('');
        $('#new-task-button').removeAttr('disabled');
        return _this.renderTask(task);
      });
    }
  };

  Checkbox.prototype.onDoneTask = function(event, task) {
    var $task,
      _this = this;
    $task = this.$taskElement(event.target);
    $('button', $task).attr('disabled', 'disabled');
    return this.tasks.setTaskDone(task, true, function() {
      $task.remove();
      return _this.renderTask(task);
    });
  };

  Checkbox.prototype.onActiveTask = function(event, task) {
    var $task,
      _this = this;
    $task = this.$taskElement(event.target);
    $('button', $task).attr('disabled', 'disabled');
    return this.tasks.setTaskDone(task, false, function() {
      $task.remove();
      return _this.renderTask(task);
    });
  };

  Checkbox.prototype.onRemoveTask = function(event, task) {
    var $task;
    $task = this.$taskElement(event.target);
    $('button', $task).attr('disabled', 'disabled');
    return this.tasks.removeTask(task, function() {
      return $task.remove();
    });
  };

  Checkbox.prototype.onSignOut = function(event, task) {
    var _this = this;
    return this.dbClient.signOut(function(error) {
      if (error) {
        return _this.showError(error);
      }
      return window.location.reload();
    });
  };

  Checkbox.prototype.$taskElement = function(element) {
    return $(element).closest('li.task');
  };

  Checkbox.prototype.wire = function() {
    var _this = this;
    return $('#new-task-form').submit(function(event) {
      return _this.onNewTask(event);
    });
  };

  Checkbox.prototype.showError = function(error) {
    $('#error-notice').removeClass('hidden');
    if (window.console) {
      return console.log(error);
    }
  };

  return Checkbox;

})();

Tasks = (function() {

  function Tasks(controller) {
    var _ref;
    this.controller = controller;
    this.dbClient = this.controller.dbClient;
    _ref = [[], []], this.active = _ref[0], this.done = _ref[1];
  }

  Tasks.prototype.load = function(done) {
    var readActive, readDone,
      _this = this;
    readActive = readDone = false;
    this.dbClient.mkdir('/active', function(error, stat) {
      return _this.dbClient.readdir('/active', function(error, entries, dir_stat, entry_stats) {
        if (error) {
          return _this.showError(error);
        }
        _this.active = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = entry_stats.length; _i < _len; _i++) {
            stat = entry_stats[_i];
            _results.push((new Task()).fromStat(stat));
          }
          return _results;
        })();
        readActive = true;
        if (readActive && readDone) {
          return done();
        }
      });
    });
    this.dbClient.mkdir('/done', function(error, stat) {
      return _this.dbClient.readdir('/done', function(error, entries, dir_stat, entry_stats) {
        if (error) {
          return _this.showError(error);
        }
        _this.done = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = entry_stats.length; _i < _len; _i++) {
            stat = entry_stats[_i];
            _results.push((new Task()).fromStat(stat));
          }
          return _results;
        })();
        readDone = true;
        if (readActive && readDone) {
          return done();
        }
      });
    });
    return this;
  };

  Tasks.prototype.addTask = function(task, done) {
    var _this = this;
    task.cleanupName();
    return this.dbClient.writeFile(task.path(), '', function(error, stat) {
      if (error) {
        return _this.showError(error);
      }
      _this.addTaskToModel(task);
      return done();
    });
  };

  Tasks.prototype.findByName = function(name) {
    var task, tasks, _i, _j, _len, _len1, _ref;
    _ref = [this.active, this.done];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tasks = _ref[_i];
      for (_j = 0, _len1 = tasks.length; _j < _len1; _j++) {
        task = tasks[_j];
        if (task.name === name) {
          return task;
        }
      }
    }
    return null;
  };

  Tasks.prototype.removeTask = function(task, done) {
    var _this = this;
    return this.dbClient.remove(task.path(), function(error, stat) {
      if (error) {
        return _this.showError(error);
      }
      _this.removeTaskFromModel(task);
      return done();
    });
  };

  Tasks.prototype.setTaskDone = function(task, newDoneValue, done) {
    var newPath, oldDoneValue, _ref,
      _this = this;
    _ref = [task.done, newDoneValue], oldDoneValue = _ref[0], task.done = _ref[1];
    newPath = task.path();
    task.done = oldDoneValue;
    return this.dbClient.move(task.path(), newPath, function(error, stat) {
      if (error) {
        return _this.showError(error);
      }
      _this.removeTaskFromModel(task);
      task.done = newDoneValue;
      _this.addTaskToModel(task);
      return done();
    });
  };

  Tasks.prototype.addTaskToModel = function(task) {
    return this.taskArray(task).push(task);
  };

  Tasks.prototype.removeTaskFromModel = function(task) {
    var index, taskArray, _i, _len, _results, _task;
    taskArray = this.taskArray(task);
    _results = [];
    for (index = _i = 0, _len = taskArray.length; _i < _len; index = ++_i) {
      _task = taskArray[index];
      if (_task === task) {
        taskArray.splice(index, 1);
        break;
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Tasks.prototype.taskArray = function(task) {
    if (task.done) {
      return this.done;
    } else {
      return this.active;
    }
  };

  Tasks.prototype.showError = function(error) {
    return this.controller.showError(error);
  };

  return Tasks;

})();

Task = (function() {

  function Task() {
    this.name = null;
    this.done = false;
  }

  Task.prototype.fromStat = function(entry) {
    this.name = entry.name;
    this.done = entry.path.split('/', 3)[1] === 'done';
    return this;
  };

  Task.prototype.cleanupName = function(name) {
    this.name = this.name.replace(/\ \/\ /g, ' or ').replace(/\//g, ' or ');
    return this;
  };

  Task.prototype.path = function() {
    return (this.done ? '/done/' : '/active/') + this.name;
  };

  return Task;

})();

$(function() {
  var client;
  client = new Dropbox.Client({
    key: '/Fahm0FLioA|ZxKxLxy5irfHqsCRs+Ceo8bwJjVPu8xZlfjgGzeCjQ',
    sandbox: true
  });
  client.authDriver(new Dropbox.Drivers.Redirect({
    rememberUser: true
  }));
  return window.app = new Checkbox(client, '#app-ui');
});
