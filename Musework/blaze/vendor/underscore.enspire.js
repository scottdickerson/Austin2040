// add some convience function to underscore all global utitly methods should be added to the utility belt
(function() {
    _.mixin({
        isJquery:function(o){
            return o instanceof jQuery;
        },
        isTouch:function() {
            // cache result
            if(!this._isTouch) {
                //this._isTouch = (function(){ try { document.createEvent("TouchEvent"); return true; } catch (e) {return false;}}());
                // updated per
                // http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
                this._isTouch = ('ontouchstart' in window || window.navigator.msMaxTouchPoints);// works on most browsers ||  works on ie10


            }
            return this._isTouch;
        },
        isAndroidStock:function() {
            // per http://stackoverflow.com/questions/9286355/how-to-detect-only-the-native-android-browser
            if(!this._ias) {
                var nua = navigator.userAgent;
                this._ias = ((nua.indexOf('Mozilla/5.0') > -1 && nua.indexOf('Android ') > -1 && nua.indexOf('AppleWebKit') > -1) && !(nua.indexOf('Chrome') > -1));
            }
            return this._ias;
        },
        hasDeviceOrientation:function() {
            if(!this._deviceOrientation) {
                this._deviceOrientation = (function(){ try { document.createEvent("DeviceOrientationEvent"); return true; } catch (e) {return false;}}());
            }
            return this._deviceOrientation;
        },
        // replaces special characters and spaces with underscores (could use some tests)
        makeKeySafe:function(s) {
            return s.replace(/[^\w\s]/gi, '').replace(/ /g,"_");
        },
        // converts 'true' to true, 'false' to 'false', 'number' to number
        processAttr:function(attr) {
            if(attr == 'true') { return true; }
            if(attr == 'false') { return false; }
            if(!isNaN(parseFloat(attr)) && isFinite(attr)) {
                return parseFloat(attr);
            }
            // allow for a array of strings
            // does not currently support nesting
            if(_.isString(attr) && attr.charAt(0) == "[" && attr.charAt(attr.length - 1) + "]") {
                var returner;
                try {
                    returner = JSON.parse(attr);
                }catch(e) {
                    returner = attr;
                }
                return returner;
            }
            return $.trim(attr);
        },
        // this scales a number between 2 0-n ranges
        toScale:function(n, from, to) {
            return Math.round((to / from) * n);
        },
        // make sure n is > from and n < to
        constrain:function(n, from, to) {
            return Math.max(from, Math.min(to, n));
        },
        posCss:function(x, y) {
            return { left:x+'px', top:y+'px'};
        },
        serializeBool:function(b) {
            return b === true ? 1 : 0;
        },
        deserializeBool:function(n) {
            return n == 1 ? true : false;
        },
        getXmlNodes: function(xml, path) {
            return $(xml).find(path);
        },
        // get args as object
        getXmlAttrs: function(node, list) {
            var n = $(node),
                args = {},
                attrs = node.attributes;

            // only get the named attrs
            if(_.isArray(list)) {
                args = _.reduce(list, function(o, attr) {
                    o[attr] = n.attr(attr);
                    return o;
                }, {});
            }else{
                _.each(attrs, function(arg) {
                    args[arg.name] = this.processAttr(arg.value);
                }, this);
            }
            return args;
        }
    });
})();