var fs = require('fs')
var path = require('path')

// add bash completions to your
//  yargs-powered applications.
module.exports = function (yargs, usage, command) {
  var self = {
    completionKey: 'get-yargs-completions'
  }

  // get a list of completion commands.
  self.getCompletion = function (done) {
    var completions = []
    var current = process.argv[process.argv.length - 1]
    var previous = process.argv.slice(process.argv.indexOf('--' + self.completionKey) + 1)
    var argv = yargs.parse(previous)

    // a custom completion function can be provided
    // to completion().
    if (completionFunction) {
      if (completionFunction.length < 3) {
        var result = completionFunction(current, argv)

        // promise based completion function.
        if (typeof result.then === 'function') {
          return result.then(function (list) {
            process.nextTick(function () { done(list) })
          }).catch(function (err) {
            process.nextTick(function () { throw err })
          })
        }

        // synchronous completion function.
        return done(result)
      } else {
        // asynchronous completion function
        return completionFunction(current, argv, function (completions) {
          done(completions)
        })
      }
    }

    var handlers = command.getCommandHandlers()
    for (var i = 0, ii = previous.length; i < ii; ++i) {
      if (handlers[previous[i]] && handlers[previous[i]].builder) {
        return handlers[previous[i]].builder(yargs.reset()).argv
      }
    }

    if (!current.match(/^-/)) {
      usage.getCommands().forEach(function (command) {
        if (previous.indexOf(command[0]) === -1) {
          completions.push(command[0])
        }
      })
    }

    if (current.match(/^-/)) {
      Object.keys(yargs.getOptions().key).forEach(function (key) {
        completions.push('--' + key)
      })
    }

    done(completions)
  }

  // generate the completion script to add to your .bashrc.
  self.generateCompletionScript = function ($0) {
    var script = fs.readFileSync(
      path.resolve(__dirname, '../completion.sh.hbs'),
      'utf-8'
    )
    var name = path.basename($0)

    // add ./to applications not yet installed as bin.
    if ($0.match(/\.js$/)) $0 = './' + $0

    script = script.replace(/{{app_name}}/g, name)
    return script.replace(/{{app_path}}/g, $0)
  }

  // register a function to perform your own custom
  // completions., this function can be either
  // synchrnous or asynchronous.
  var completionFunction = null
  self.registerFunction = function (fn) {
    completionFunction = fn
  }

  return self
}
