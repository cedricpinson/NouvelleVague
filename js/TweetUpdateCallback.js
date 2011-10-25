var consumeTweets = function(tweetList) {
    if (twitterManager === undefined) {
        twitterManager = new TweetManager();
    }
    twitterManager.addList(tweetList);
};

var TweetManager = function(list) {
    this.index = 0;
    this.setItemList(list); 
    this._tweetList = [];
    this._tweetRate = 1.0; // tweet per second;
};

TweetManager.prototype = {
    setItemList: function(list) { this._list = list;},
    addList: function(tweetList) {
        var nb = tweetList.length;
        var max = 200;
        for (var i = 0, l = nb; i < l; i++) {
            this._tweetList.push(tweetList[i]);
        }
        if (this._tweetList.length > max) {
            this._tweetList.splice(0, max-this._tweetList.length);
        }
    },
    getDefaultTweet: function() {
        var idx = Math.floor(Math.random() * DefaultTweets.length);
        return DefaultTweets[idx];
    },
    getTweet: function() {
        if (this._tweetList.length > 0) {
            return this._tweetList.pop();
        }
        return this.getDefaultTweet();
    },

    processTweetOnItem: function( item, tweet) {
        if (tweet !== undefined) {
            item.runTweet(tweet);
        } else {
            item.setNodeMask(0x0);
        }
    },
    setRate: function(rate) {
        this._tweetRate = rate;
    },
    getNbTweetToConsume: function() {
        if (this.lastCall === undefined) {
            this.lastCall = (new Date()).getTime();
        }
        var lastCall = this.lastCall;

        var now = (new Date()).getTime();
        var elapsed = (now-lastCall)/1000.0;

        var ratio = this._tweetRate;
        var nbTweets = elapsed * ratio;
        
        var clamped = Math.floor(nbTweets);

        var diff = (nbTweets-clamped)*1000.0/ratio;
        if (clamped > 0) {
            this.lastCall = now - diff;
        }

        return clamped;
    },

    update: function() {
        if (Intro === true) {
            this.lastCall = (new Date()).getTime();
            return;
        }

        var nb = this.getNbTweetToConsume();
        if (nb === 0) {
            return;
        }
        var list = this._list;
        for (var i = 0, l = list.length; i < l; i++) {
            var item = list[i];
            if (item.isAvailable()) {
                this.processTweetOnItem(item, this.getTweet());
                nb--;
                if (nb === 0) {
                    break;
                }
            }
        }
    }
};



var createTweetTexture = function(tweet, texture) {
    var canvas;
    if (texture) {
        canvas = texture.getImage();
    }
    canvas = displayTweetToCanvas(tweet, canvas);

    var w = canvas.textureWidth;
    var h = canvas.textureHeight;
    var tx = 512;
    var ty = 128;

    var v = h/ty;

    if (texture === undefined) {
        texture = new osg.Texture();
        texture.setMinFilter('LINEAR_MIPMAP_LINEAR');
    }
    texture.setFromCanvas(canvas,osg.Texture.LUMINANCE);

    texture.vOffset = v;
    texture.tweetSize = [ w, h];
    return texture;
};
var TweetScale = 0.05;
var createTweetModel = function(tweet, model) {
    var textureOriginal = undefined;
    var texture = undefined;
    if (model) {
        textureOriginal = model.getOrCreateStateSet().getTextureAttribute(0, 'Texture');
    }
    texture = createTweetTexture(tweet, textureOriginal);

    var scale = TweetScale;
    var w = texture.tweetSize[0] * scale;
    var h = w/4; //texture.tweetSize[1] * scale;
    if (model === undefined) {
        model = createTexturedBox(0.0, 0.0, 0.0,
                                  w, h, h/2.0/3.00,
                                  0.0, 1.0,
                                  1.0-texture.vOffset, 1.0);

        model.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
        model.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
        model.vOffset = texture.vOffset;
    }
    return [ model, texture];
};


var TweetUpdateCallback = function(geometry) { 
    this._tweetGeometry = geometry;
    this._lastPosition = undefined;
};

TweetUpdateCallback.prototype = {
    addTweet: function(tweet) {
        this._newTweet = tweet;
        this._tweetText = tweet;
    },
    transition: function() {
        if (this._tweetText) {
            this._executeTransition = true;
        }
    },
    getWorldMatrix: function(node) {
        var matrix = node.getWorldMatrices()[0];
        if (this._lastPosition === undefined) {
            this._lastPosition = [];
            osg.Matrix.getTrans(matrix, this._lastPosition);
        }
        return matrix;
    },
    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();

        if (this._newTweet !== undefined) {
            createTweetModel(this._newTweet, this._tweetGeometry);
            this._tweetGeometry.setNodeMask(~0x0);
            if (node.hasChild(this._executeTransition)) {
                node.removeChild(this._executeTransition);
            }
            this._tweetGeometry.setNodeMask(~0x0);
            this._newTweet = undefined;
        }

        var matrix;
        var inv;
        if (this._executeTransition) {
            if (this._transition !== undefined) {
                node.removeChild(this._transition);
            }
            Ribbons.addTweet(this._tweetText);

            matrix = this.getWorldMatrix(node);
            var stateset = this._tweetGeometry.getStateSet();
            var texture = stateset.getTextureAttribute(0,'Texture');
            var trans = [];
            osg.Matrix.getTrans(matrix, trans);
            var speed = [];
            osg.Vec3.sub(trans, this._lastPosition, speed);
            this._lastPosition = trans;

            inv = [];
            osg.Matrix.inverse(matrix, inv);
            
            this._transition = createEffect(texture, [ 0 ,0 ,10], matrix, t, speed);
            //this._transition.getOrCreateStateSet().setAttributeAndMode(getTextShader());
            this._transition.setMatrix(inv);
            this._executeTransition = false;
            node.addChild(this._transition);
            this._tweetGeometry.setNodeMask(0x0);

            this._tweetText = undefined;
        } else {
            matrix = this.getWorldMatrix(node);
            var trans = [];
            osg.Matrix.getTrans(matrix, trans);
            this._lastPosition = trans;

            if (this._transition !== undefined) {
                inv = [];
                osg.Matrix.inverse(matrix, this._transition.getMatrix());
            }
        }
        return true;
    }
};


var DefaultTweets = [
    {
        "created_at": "Tue, 18 Oct 2011 06:43:20 +0000", 
        "from_user": "gianniskap", 
        "from_user_id": 402811911, 
        "from_user_id_str": "402811911", 
        "geo": null, 
        "id": 126186584201633792, 
        "id_str": "126186584201633792", 
        "iso_language_code": "it", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1205528407/K_normal.png", 
        "source": "&lt;a href=&quot;http://twitter.com/tweetbutton&quot; rel=&quot;nofollow&quot;&gt;Tweet Button&lt;/a&gt;", 
        "text": "Google Panda par ultranoir http://t.co/ox1Ycwn6", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Mon, 17 Oct 2011 15:05:24 +0000", 
        "from_user": "javascriptalert", 
        "from_user_id": 258391381, 
        "from_user_id_str": "258391381", 
        "geo": null, 
        "id": 125950546489262081, 
        "id_str": "125950546489262081", 
        "iso_language_code": "it", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a1.twimg.com/profile_images/1304350707/___normal.png", 
        "source": "&lt;a href=&quot;http://twitterfeed.com&quot; rel=&quot;nofollow&quot;&gt;twitterfeed&lt;/a&gt;", 
        "text": "ultranoir \u2022 accueil:  http://t.co/f31JpZDo", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Mon, 17 Oct 2011 06:44:00 +0000", 
        "from_user": "webgeekly", 
        "from_user_id": 178762804, 
        "from_user_id_str": "178762804", 
        "geo": null, 
        "id": 125824360987623425, 
        "id_str": "125824360987623425", 
        "iso_language_code": "en", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a1.twimg.com/profile_images/1161338529/boxlogo_normal.png", 
        "source": "&lt;a href=&quot;http://www.ajaymatharu.com/&quot; rel=&quot;nofollow&quot;&gt;Tweet Old Post&lt;/a&gt;", 
        "text": "http://t.co/H8NPfKIt - Impressive Visual Effects &amp; Animations http://t.co/VqcWhC9r", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Sun, 16 Oct 2011 17:29:10 +0000", 
        "from_user": "gianniskap", 
        "from_user_id": 402811911, 
        "from_user_id_str": "402811911", 
        "geo": null, 
        "id": 125624337003839489, 
        "id_str": "125624337003839489", 
        "iso_language_code": "it", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1205528407/K_normal.png", 
        "source": "&lt;a href=&quot;http://twitter.com/tweetbutton&quot; rel=&quot;nofollow&quot;&gt;Tweet Button&lt;/a&gt;", 
        "text": "Web 3.0 par ultranoir http://t.co/xWi3tz58", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Sat, 15 Oct 2011 11:09:05 +0000", 
        "from_user": "Fuckvancarter", 
        "from_user_id": 417038067, 
        "from_user_id_str": "417038067", 
        "geo": null, 
        "id": 125166298337517568, 
        "id_str": "125166298337517568", 
        "iso_language_code": "fr", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a0.twimg.com/profile_images/1590162451/28638_1467782492115_1160156301_31345604_3236093_n_normal.jpg", 
        "source": "&lt;a href=&quot;http://blackberry.com/twitter&quot; rel=&quot;nofollow&quot;&gt;Twitter for BlackBerry\u00ae&lt;/a&gt;", 
        "text": "Je t'explique : le blabla est un jeune homme (ultranoir de peau) qui vient d'arriver en suisse.", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 19:57:19 +0000", 
        "from_user": "rubxkub", 
        "from_user_id": 13461226, 
        "from_user_id_str": "13461226", 
        "geo": null, 
        "id": 124936842121457665, 
        "id_str": "124936842121457665", 
        "iso_language_code": "no", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1412534672/image_normal.jpg", 
        "source": "&lt;a href=&quot;http://twitter.com/#!/download/iphone&quot; rel=&quot;nofollow&quot;&gt;Twitter for iPhone&lt;/a&gt;", 
        "text": "FF Back @benjvasseur: #FF design et HTML5 @ultranoir @MathildeVandier", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 19:45:44 +0000", 
        "from_user": "charsmith88", 
        "from_user_id": 5606710, 
        "from_user_id_str": "5606710", 
        "geo": null, 
        "id": 124933928594321408, 
        "id_str": "124933928594321408", 
        "iso_language_code": "en", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a0.twimg.com/profile_images/1468037153/Risa2_normal.jpg", 
        "source": "&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;", 
        "text": "You know that a part of me belongs to no one but you #ultranoir", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 18:52:49 +0000", 
        "from_user": "thibaulthagenbo", 
        "from_user_id": 93755981, 
        "from_user_id_str": "93755981", 
        "geo": null, 
        "id": 124920612689936384, 
        "id_str": "124920612689936384", 
        "iso_language_code": "eo", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a0.twimg.com/profile_images/1359907052/thibault_normal.jpg", 
        "source": "&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;", 
        "text": "#FF @v2com_newswire @Kryzalid_ @sept24social @KDiop @Defipub @eskistudio @em_lagence @vanksen @wcie @upperkut @ultranoir @w_illi_am", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 18:47:17 +0000", 
        "from_user": "Nat_Apache", 
        "from_user_id": 256552594, 
        "from_user_id_str": "256552594", 
        "geo": null, 
        "id": 124919217551183872, 
        "id_str": "124919217551183872", 
        "iso_language_code": "fr", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1323662242/APACHE_2_normal.jpg", 
        "source": "&lt;a href=&quot;http://twitter.com/#!/download/iphone&quot; rel=&quot;nofollow&quot;&gt;Twitter for iPhone&lt;/a&gt;", 
        "text": "Parce qu'ils sont indispensables #FF @roddebyser @azulita102 @mathildevandier @thierry_moussu @benjvasseur @ultranoir @msvk", 
        "to_user": "roddebyser", 
        "to_user_id": 21481942, 
        "to_user_id_str": "21481942"
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 18:46:03 +0000", 
        "from_user": "Nat_Apache", 
        "from_user_id": 256552594, 
        "from_user_id_str": "256552594", 
        "geo": null, 
        "id": 124918908426784768, 
        "id_str": "124918908426784768", 
        "iso_language_code": "en", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1323662242/APACHE_2_normal.jpg", 
        "source": "&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;", 
        "text": "RT @roddebyser: #FF indispensable @Azulita102 @MathildeVandier @Thierry_Moussu @benjvasseur  @ultranoir @MSVK @nat_apache @LocitaStartUp @creads", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 18:32:17 +0000", 
        "from_user": "VincentGarreau", 
        "from_user_id": 82851370, 
        "from_user_id_str": "82851370", 
        "geo": null, 
        "id": 124915444007178240, 
        "id_str": "124915444007178240", 
        "iso_language_code": "fr", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a3.twimg.com/profile_images/1497252478/vincent-garreau-profil_normal.png", 
        "source": "&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;", 
        "text": "#FF \u00e0 quelques agences dans lesquelles on a envie de faire son stage : @agencedagobert @ultranoir @fcinqagency @wype &amp; http://t.co/JdxQH07L", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 16:12:51 +0000", 
        "from_user": "Jam_Ultranoir", 
        "from_user_id": 30225046, 
        "from_user_id_str": "30225046", 
        "geo": null, 
        "id": 124880354472509440, 
        "id_str": "124880354472509440", 
        "iso_language_code": "it", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1264605872/5411299351_ea7eff46ba_b2222_normal.jpg", 
        "source": "&lt;a href=&quot;http://www.facebook.com/twitter&quot; rel=&quot;nofollow&quot;&gt;Facebook&lt;/a&gt;", 
        "text": "JAM ULTRANOIR - $P33D$P333D\u041b\u0443\u043d\u0430\u043f\u0430\u0440\u043aMIX http://t.co/oLhpwcwR", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 16:04:59 +0000", 
        "from_user": "Jam_Ultranoir", 
        "from_user_id": 30225046, 
        "from_user_id_str": "30225046", 
        "geo": null, 
        "id": 124878373896990722, 
        "id_str": "124878373896990722", 
        "iso_language_code": "eo", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1264605872/5411299351_ea7eff46ba_b2222_normal.jpg", 
        "source": "&lt;a href=&quot;http://www.tumblr.com/&quot; rel=&quot;nofollow&quot;&gt;Tumblr&lt;/a&gt;", 
        "text": "Audio: JAM ULTRANOIR - $P33D$P333D\u041b\u0443\u043d\u0430\u043f\u0430\u0440\u043aMIX | Jam Ultranoir JAM VLTRAN0IR - $P33D$P333D\u041b\u0443\u043d\u0430-\u043f\u0430\u0440\u043aMIX http://t.co/LeFGjTMj", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 16:04:55 +0000", 
        "from_user": "Jam_Ultranoir", 
        "from_user_id": 30225046, 
        "from_user_id_str": "30225046", 
        "geo": null, 
        "id": 124878358080258048, 
        "id_str": "124878358080258048", 
        "iso_language_code": "fr", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1264605872/5411299351_ea7eff46ba_b2222_normal.jpg", 
        "source": "&lt;a href=&quot;http://soundcloud.com&quot; rel=&quot;nofollow&quot;&gt;SoundCloud&lt;/a&gt;", 
        "text": "JAM VLTRAN0IR - $P33D$P333D\u041b\u0443\u043d\u0430-\u043f\u0430\u0440\u043aMIX\n: JAM ULTRANOIR - $P33D$P333D\u041b\u0443\u043d\u0430\u043f\u0430\u0440\u043aMIX on #SoundCloud http://t.co/Zh7aiI1U", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 14:11:01 +0000", 
        "from_user": "ultranoir", 
        "from_user_id": 7491438, 
        "from_user_id_str": "7491438", 
        "geo": null, 
        "id": 124849693275594752, 
        "id_str": "124849693275594752", 
        "iso_language_code": "fr", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1171385155/logo_UN_tweet_normal.jpg", 
        "source": "&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;", 
        "text": "@borislechartier @benjvasseur @roddebyser Merci pour le #FF ! Rendez-vous jeudi =)", 
        "to_user": "borislechartier", 
        "to_user_id": 101209896, 
        "to_user_id_str": "101209896"
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 14:05:32 +0000", 
        "from_user": "ultranoir", 
        "from_user_id": 7491438, 
        "from_user_id_str": "7491438", 
        "geo": null, 
        "id": 124848314297483264, 
        "id_str": "124848314297483264", 
        "iso_language_code": "en", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1171385155/logo_UN_tweet_normal.jpg", 
        "source": "&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;", 
        "text": "ultranoir #1 on Awwwards : Let's have a quick look to the rewarded projects http://t.co/4HutF0Q9 #webdesign #top100", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 12:02:08 +0000", 
        "from_user": "jbacelar", 
        "from_user_id": 5929424, 
        "from_user_id_str": "5929424", 
        "geo": null, 
        "id": 124817260492759040, 
        "id_str": "124817260492759040", 
        "iso_language_code": "en", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a1.twimg.com/profile_images/86021631/IMG_01005_normal.jpg", 
        "source": "&lt;a href=&quot;http://www.facebook.com/twitter&quot; rel=&quot;nofollow&quot;&gt;Facebook&lt;/a&gt;", 
        "text": "http://t.co/Ds3S7SCL http://t.co/5Qc1GPXM", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 10:50:17 +0000", 
        "from_user": "akalchuk", 
        "from_user_id": 170452067, 
        "from_user_id_str": "170452067", 
        "geo": null, 
        "id": 124799177875140609, 
        "id_str": "124799177875140609", 
        "iso_language_code": "ru", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a2.twimg.com/profile_images/1432089871/image_normal.jpg", 
        "source": "&lt;a href=&quot;https://wiki.ubuntu.com/Gwibber&quot; rel=&quot;nofollow&quot;&gt;Ubuntu&lt;/a&gt;", 
        "text": "RT @loginname2: http://t.co/6gCxNZB9 \u043a\u0440\u0430\u0441\u0438\u0432\u044b\u0439 \u0441\u0430\u0439\u0442 \u0438 \u0441\u0430\u043c\u043e\u0435 \u0433\u043b\u0430\u0432\u043d\u043e\u0435 \u043d\u0438\u043a\u0430\u043a\u043e\u0433\u043e \u0444\u043b\u0435\u0448\u0430!!", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 10:26:57 +0000", 
        "from_user": "loginname2", 
        "from_user_id": 423640507, 
        "from_user_id_str": "423640507", 
        "geo": null, 
        "id": 124793304536727552, 
        "id_str": "124793304536727552", 
        "iso_language_code": "ru", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a0.twimg.com/sticky/default_profile_images/default_profile_5_normal.png", 
        "source": "&lt;a href=&quot;https://wiki.ubuntu.com/Gwibber&quot; rel=&quot;nofollow&quot;&gt;Ubuntu&lt;/a&gt;", 
        "text": "http://t.co/6gCxNZB9 \u043a\u0440\u0430\u0441\u0438\u0432\u044b\u0439 \u0441\u0430\u0439\u0442 \u0438 \u0441\u0430\u043c\u043e\u0435 \u0433\u043b\u0430\u0432\u043d\u043e\u0435 \u043d\u0438\u043a\u0430\u043a\u043e\u0433\u043e \u0444\u043b\u0435\u0448\u0430!!", 
        "to_user_id": null, 
        "to_user_id_str": null
    }, 
    {
        "created_at": "Fri, 14 Oct 2011 10:04:06 +0000", 
        "from_user": "roddebyser", 
        "from_user_id": 21481942, 
        "from_user_id_str": "21481942", 
        "geo": null, 
        "id": 124787555299364864, 
        "id_str": "124787555299364864", 
        "iso_language_code": "en", 
        "metadata": {
            "result_type": "recent"
        }, 
        "profile_image_url": "http://a1.twimg.com/profile_images/1363520555/f8dcc7d13e204af8960b35f58e25b13a_7_normal.jpg", 
        "source": "&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;", 
        "text": "#FF indispensable @Azulita102 @MathildeVandier @Thierry_Moussu @benjvasseur  @ultranoir @MSVK @nat_apache @LocitaStartUp @creads", 
        "to_user_id": null, 
        "to_user_id_str": null
    }
];