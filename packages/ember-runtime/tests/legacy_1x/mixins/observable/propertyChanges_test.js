/*
  NOTE: This test is adapted from the 1.x series of unit tests.  The tests
  are the same except for places where we intend to break the API we instead
  validate that we warn the developer appropriately.

  CHANGES FROM 1.6:

  * Create ObservableObject which includes Ember.Observable
  * Remove test that tests internal _kvo_changeLevel property.  This is an
    implementation detail.
  * Remove test for allPropertiesDidChange
  * Removed star observer test.  no longer supported
  * Removed property revision test.  no longer supported
*/

// ========================================================================
// Ember.Observable Tests
// ========================================================================

import EmberObject from 'ember-runtime/system/object';
import Observable from 'ember-runtime/mixins/observable';
import {computed} from 'ember-metal/computed';
import {observer} from "ember-metal/mixin";

var ObservableObject = EmberObject.extend(Observable);

var revMatches = false;
var ObjectA;

QUnit.module("object.propertyChanges", {
  setup: function() {
    ObjectA = ObservableObject.createWithMixins({
      foo  : 'fooValue',
      prop : 'propValue',

      action: observer('foo', function() {
        this.set('prop', 'changedPropValue');
      }),

      newFoo : 'newFooValue',
      newProp: 'newPropValue',

      notifyAction: observer('newFoo', function() {
        this.set('newProp', 'changedNewPropValue');
      }),

      notifyAllAction: observer('prop', function() {
        this.set('newFoo', 'changedNewFooValue');
      }),

      starProp: null,
      starObserver: function(target, key, value, rev) {
        revMatches = (rev === target.propertyRevision) ;
        this.starProp = key;
      }

    });
  }
});

test("should observe the changes within the nested begin / end property changes", function() {

  //start the outer nest
  ObjectA.beginPropertyChanges();

  // Inner nest
  ObjectA.beginPropertyChanges();
  ObjectA.set('foo', 'changeFooValue');

  equal(ObjectA.prop, "propValue") ;
  ObjectA.endPropertyChanges();

    //end inner nest
  ObjectA.set('prop', 'changePropValue');
  equal(ObjectA.newFoo, "newFooValue") ;

  //close the outer nest
  ObjectA.endPropertyChanges();

  equal(ObjectA.prop, "changedPropValue") ;
  equal(ObjectA.newFoo, "changedNewFooValue") ;
});

test("should observe the changes within the begin and end property changes", function() {

  ObjectA.beginPropertyChanges();
  ObjectA.set('foo', 'changeFooValue');

  equal(ObjectA.prop, "propValue") ;
  ObjectA.endPropertyChanges();

  equal(ObjectA.prop, "changedPropValue") ;
});

test("should indicate that the property of an object has just changed", function() {
  // inidicate that proprty of foo will change to its subscribers
  ObjectA.propertyWillChange('foo') ;

  //Value of the prop is unchanged yet as this will be changed when foo changes
  equal(ObjectA.prop, 'propValue' ) ;

  //change the value of foo.
  ObjectA.set('foo', 'changeFooValue');

  // Indicate the subscribers of foo that the value has just changed
  ObjectA.propertyDidChange('foo', null) ;

  // Values of prop has just changed
  equal(ObjectA.prop,'changedPropValue') ;
});

test("should notify that the property of an object has changed", function() {
  // Notify to its subscriber that the values of 'newFoo' will be changed. In this
  // case the observer is "newProp". Therefore this will call the notifyAction function
  // and value of "newProp" will be changed.
  ObjectA.notifyPropertyChange('newFoo','fooValue');

  //value of newProp changed.
  equal(ObjectA.newProp,'changedNewPropValue') ;
});

test("should invalidate function property cache when notifyPropertyChange is called", function() {

  var a = ObservableObject.createWithMixins({
    _b: null,
    b: computed(function(key, value) {
      if (value !== undefined) {
        this._b = value;
        return this;
      }
      return this._b;
    }).volatile()
  });

  a.set('b', 'foo');
  equal(a.get('b'), 'foo', 'should have set the correct value for property b');

  a._b = 'bar';
  a.notifyPropertyChange('b');
  a.set('b', 'foo');
  equal(a.get('b'), 'foo', 'should have invalidated the cache so that the newly set value is actually set');

});
