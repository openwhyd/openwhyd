var my = '../index';

exports.EventManager = my.Class({

  // @param(String...)
  // @param(Array of String)
  constructor: function() {
    this.bindings = {};
    if (arguments.length > 0) {
      var events = typeof arguments[0] === 'string' ? arguments : arguments[0];
      this.authorized = {};
      for (var i = 0; i < events.length; i++)
        this.authorized[events[i]] = true;
    }
  },

  // @param(event:String, listener:Function, options:Object?)
  // @param(event:String, listener:Function, runCount:int?)
  // @return(my.utils.EventManager.Binding)
  // @param(event:String)
  // @return(Array of my.utils.EventManager.Binding)
  on: function(event, listener, a2) {

    if (arguments.length === 1)
      return this.bindings[event];

    if (this.authorized && !this.authorized[event])
      throw new Error('my.utils.EventManager.on: unauthorized <event=' + event + '>');

    var bindings = this.bindings[event];
    if (!bindings) {
      bindings = this.bindings[event] = [];
    }

    var binding;
    for (var i = 0; i < bindings.length; i++) {
      if (bindings[i].listener === listener) {
        binding = bindings[i];
        break;
      }
    }

    if (binding) {
      if (typeof a2 === 'number') {
        binding.runCount = a2;
      } else if (a2 && a2.constructor === Object) {
        if ('runCount' in a2)
          binding.runCount = a2.runCount;
        if ('eventObject' in a2)
          binding.eventObject = a2.eventObject;
        if ('context' in a2)
          binding.context = a2.context;
      }
    } else {
      binding = new Binding(this, event, listener);
      bindings.push(binding);
      if (typeof a2 === 'number') {
        binding.runCount = a2 || Number.POSITIVE_INFINITY
      } else if (a2 && a2.constructor === Object) {
        binding.runCount = a2.runCount || Number.POSITIVE_INFINITY;
        binding.eventObject = a2.eventObject;
        binding.context = a2.context;
      } else {
        binding.runCount = Number.POSITIVE_INFINITY;
      }
    }

    return binding;

  },

  // @param(event:String, listener:Function?)
  // @return(Boolean)
  non: function(event, listener) {
    var bindings = this.bindings[event], i;
    if (bindings) {
      if (listener) {
        for (i = 0; i < bindings.length; i++) {
          if (bindings[i].listener === listener)
            break;
        }
        if (i < bindings.length)
          bindings.splice(i, 1);
        if (bindings.length === 0)
          delete this.bindings[event];
      } else {
        delete this.bindings[event];
      }
      return true;
    }
    return false;
  },

  // @param(event:String, eventObject:Any?, context:Any?)
  // @param(event:String, eventObject:Array of Any?, context:Any?)
  fire : function(event, eventObject, context) {
    var bindings = this.bindings[event], binding, obj, ctx, i;
    if (bindings) {
      for (i = 0; i < bindings.length; i++) {
        binding = bindings[i];
        obj = binding.eventObject || eventObject;
        ctx = binding.context || context || this;
        if (obj && obj.constructor === Array)
          binding.listener.apply(ctx, obj);
        else
          binding.listener.call(ctx, obj);
        binding.runCount--;
      }
      for (i = bindings.length - 1; i >= 0; i--) {
        if (bindings[i].runCount == 0)
          bindings.splice(i, 1);
      }
      if (bindings.length == 0) {
        delete this.bindings[event];
      }
    }
  }
});


//==============================================================================
var Binding = my.utils.EventManager.Binding = my.Class({

  constructor: function(eventManager, event, listener) {
    this.eventManager = eventManager;
    this.event = event;
    this.listener = listener;
  },

  remove: function() {
    this.eventManager.non(this.event, this.listener);
  }

});

