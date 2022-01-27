/**
 * @file
 * JavaScript behaviors for CodeMirror integration.
 */

(function ($, Drupal) {

  'use strict';

  // @see http://codemirror.net/doc/manual.html#config
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.codeMirror = Drupal.webform.codeMirror || {};
  Drupal.webform.codeMirror.options = Drupal.webform.codeMirror.options || {};

  /**
   * Initialize CodeMirror editor.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformCodeMirror = {
    attach: function (context) {
      if (!window.CodeMirror) {
        return;
      }

      // Webform CodeMirror editor.
      $(context).find('textarea.js-webform-codemirror').once('webform-codemirror').each(function () {
        var $input = $(this);

        // Open all closed details, so that editor height is correctly calculated.
        var $details = $input.parents('details:not([open])');
        $details.attr('open', 'open');

        // #59 HTML5 required attribute breaks hack for webform submission.
        // https://github.com/marijnh/CodeMirror-old/issues/59
        $input.removeAttr('required');

        var options = $.extend({
          mode: $input.attr('data-webform-codemirror-mode'),
          lineNumbers: true,
          lineWrapping: ($input.attr('wrap') !== 'off'),
          viewportMargin: Infinity,
          readOnly: !!($input.prop('readonly') || $input.prop('disabled')),
          extraKeys: {
            // Setting for using spaces instead of tabs - https://github.com/codemirror/CodeMirror/issues/988
            Tab: function (cm) {
              var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
              cm.replaceSelection(spaces, 'end', '+element');
            },
            // On 'Escape' move to the next tabbable input.
            // @see http://bgrins.github.io/codemirror-accessible/
            Esc: function (cm) {
              // Must show and then textarea so that we can determine
              // its tabindex.
              var textarea = $(cm.getTextArea());
              $(textarea).show().addClass('visually-hidden');
              var $tabbable = $(':tabbable');
              var tabindex = $tabbable.index(textarea);
              $(textarea).hide().removeClass('visually-hidden');

              // Tabindex + 2 accounts for the CodeMirror's iframe.
              $tabbable.eq(tabindex + 2).trigger('focus');
            }

          }
        }, Drupal.webform.codeMirror.options);

        var editor = CodeMirror.fromTextArea(this, options);

        // Now, close details.
        $details.removeAttr('open');

        // Apply the textarea's min/max-height to the CodeMirror editor.
        if ($input.css('min-height')) {
          var minHeight = $input.css('min-height');
          $(editor.getWrapperElement())
            .css('min-height', minHeight)
            .find('.CodeMirror-scroll')
            .css('min-height', minHeight);
        }
        if ($input.css('max-height')) {
          var maxHeight = $input.css('max-height');
          $(editor.getWrapperElement())
            .css('max-height', maxHeight)
            .find('.CodeMirror-scroll')
            .css('max-height', maxHeight);
        }

        // Issue #2764443: CodeMirror is not setting submitted value when
        // rendered within a webform UI dialog or within an Ajaxified element.
        var changeTimer = null;
        editor.on('change', function () {
          if (changeTimer) {
            window.clearTimeout(changeTimer);
            changeTimer = null;
          }
          changeTimer = setTimeout(function () {editor.save();}, 500);
        });

        // Update CodeMirror when the textarea's value has changed.
        // @see webform.states.js
        $input.on('change', function () {
          editor.getDoc().setValue($input.val());
        });

        // Set CodeMirror to be readonly when the textarea is disabled.
        // @see webform.states.js
        $input.on('webform:disabled', function () {
          editor.setOption('readOnly', $input.is(':disabled'));
        });

        // Delay refreshing CodeMirror for 500 millisecond while the dialog is
        // still being rendered.
        // @see http://stackoverflow.com/questions/8349571/codemirror-editor-is-not-loading-content-until-clicked
        setTimeout(function () {
          // Show tab panel and open details.
          var $tabPanel = $input.parents('.ui-tabs-panel:hidden');
          var $details = $input.parents('details:not([open])');

          if (!$tabPanel.length && $details.length) {
            return;
          }

          $tabPanel.show();
          $details.attr('open', 'open');

          editor.refresh();

          // Hide tab panel and close details.
          $tabPanel.hide();
          $details.removeAttr('open');
        }, 500);
      });

      // Webform CodeMirror syntax coloring.
      if (window.CodeMirror.runMode) {
        $(context).find('.js-webform-codemirror-runmode').once('webform-codemirror-runmode').each(function () {
          // Mode Runner - http://codemirror.net/demo/runmode.html
          CodeMirror.runMode($(this).addClass('cm-s-default').text(), $(this).attr('data-webform-codemirror-mode'), this);
        });
      }

    }
  };

})(jQuery, Drupal);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.theme.progressBar = function (id) {
    return "<div id=\"".concat(id, "\" class=\"progress\" aria-live=\"polite\">") + '<div class="progress__label">&nbsp;</div>' + '<div class="progress__track"><div class="progress__bar"></div></div>' + '<div class="progress__percentage"></div>' + '<div class="progress__description">&nbsp;</div>' + '</div>';
  };

  Drupal.ProgressBar = function (id, updateCallback, method, errorCallback) {
    this.id = id;
    this.method = method || 'GET';
    this.updateCallback = updateCallback;
    this.errorCallback = errorCallback;
    this.element = $(Drupal.theme('progressBar', id));
  };

  $.extend(Drupal.ProgressBar.prototype, {
    setProgress: function setProgress(percentage, message, label) {
      if (percentage >= 0 && percentage <= 100) {
        $(this.element).find('div.progress__bar').css('width', "".concat(percentage, "%"));
        $(this.element).find('div.progress__percentage').html("".concat(percentage, "%"));
      }

      $('div.progress__description', this.element).html(message);
      $('div.progress__label', this.element).html(label);

      if (this.updateCallback) {
        this.updateCallback(percentage, message, this);
      }
    },
    startMonitoring: function startMonitoring(uri, delay) {
      this.delay = delay;
      this.uri = uri;
      this.sendPing();
    },
    stopMonitoring: function stopMonitoring() {
      clearTimeout(this.timer);
      this.uri = null;
    },
    sendPing: function sendPing() {
      if (this.timer) {
        clearTimeout(this.timer);
      }

      if (this.uri) {
        var pb = this;
        var uri = this.uri;

        if (uri.indexOf('?') === -1) {
          uri += '?';
        } else {
          uri += '&';
        }

        uri += '_format=json';
        $.ajax({
          type: this.method,
          url: uri,
          data: '',
          dataType: 'json',
          success: function success(progress) {
            if (progress.status === 0) {
              pb.displayError(progress.data);
              return;
            }

            pb.setProgress(progress.percentage, progress.message, progress.label);
            pb.timer = setTimeout(function () {
              pb.sendPing();
            }, pb.delay);
          },
          error: function error(xmlhttp) {
            var e = new Drupal.AjaxError(xmlhttp, pb.uri);
            pb.displayError("<pre>".concat(e.message, "</pre>"));
          }
        });
      }
    },
    displayError: function displayError(string) {
      var error = $('<div class="messages messages--error"></div>').html(string);
      $(this.element).before(error).hide();

      if (this.errorCallback) {
        this.errorCallback(this);
      }
    }
  });
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, once) {
  var deprecatedMessageSuffix = "is deprecated in Drupal 9.3.0 and will be removed in Drupal 10.0.0. Use the core/once library instead. See https://www.drupal.org/node/3158256";
  var originalJQOnce = $.fn.once;
  var originalJQRemoveOnce = $.fn.removeOnce;

  $.fn.once = function jQueryOnce(id) {
    Drupal.deprecationError({
      message: "jQuery.once() ".concat(deprecatedMessageSuffix)
    });
    return originalJQOnce.apply(this, [id]);
  };

  $.fn.removeOnce = function jQueryRemoveOnce(id) {
    Drupal.deprecationError({
      message: "jQuery.removeOnce() ".concat(deprecatedMessageSuffix)
    });
    return originalJQRemoveOnce.apply(this, [id]);
  };

  var drupalOnce = once;

  function augmentedOnce(id, selector, context) {
    originalJQOnce.apply($(selector, context), [id]);
    return drupalOnce(id, selector, context);
  }

  function remove(id, selector, context) {
    originalJQRemoveOnce.apply($(selector, context), [id]);
    return drupalOnce.remove(id, selector, context);
  }

  window.once = Object.assign(augmentedOnce, drupalOnce, {
    remove: remove
  });
})(jQuery, once);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

(function ($, window, Drupal, drupalSettings, _ref) {
  var isFocusable = _ref.isFocusable,
      tabbable = _ref.tabbable;
  Drupal.behaviors.AJAX = {
    attach: function attach(context, settings) {
      function loadAjaxBehavior(base) {
        var elementSettings = settings.ajax[base];

        if (typeof elementSettings.selector === 'undefined') {
          elementSettings.selector = "#".concat(base);
        }

        once('drupal-ajax', $(elementSettings.selector)).forEach(function (el) {
          elementSettings.element = el;
          elementSettings.base = base;
          Drupal.ajax(elementSettings);
        });
      }

      Object.keys(settings.ajax || {}).forEach(function (base) {
        return loadAjaxBehavior(base);
      });
      Drupal.ajax.bindAjaxLinks(document.body);
      once('ajax', '.use-ajax-submit').forEach(function (el) {
        var elementSettings = {};
        elementSettings.url = $(el.form).attr('action');
        elementSettings.setClick = true;
        elementSettings.event = 'click';
        elementSettings.progress = {
          type: 'throbber'
        };
        elementSettings.base = el.id;
        elementSettings.element = el;
        Drupal.ajax(elementSettings);
      });
    },
    detach: function detach(context, settings, trigger) {
      if (trigger === 'unload') {
        Drupal.ajax.expired().forEach(function (instance) {
          Drupal.ajax.instances[instance.instanceIndex] = null;
        });
      }
    }
  };

  Drupal.AjaxError = function (xmlhttp, uri, customMessage) {
    var statusCode;
    var statusText;
    var responseText;

    if (xmlhttp.status) {
      statusCode = "\n".concat(Drupal.t('An AJAX HTTP error occurred.'), "\n").concat(Drupal.t('HTTP Result Code: !status', {
        '!status': xmlhttp.status
      }));
    } else {
      statusCode = "\n".concat(Drupal.t('An AJAX HTTP request terminated abnormally.'));
    }

    statusCode += "\n".concat(Drupal.t('Debugging information follows.'));
    var pathText = "\n".concat(Drupal.t('Path: !uri', {
      '!uri': uri
    }));
    statusText = '';

    try {
      statusText = "\n".concat(Drupal.t('StatusText: !statusText', {
        '!statusText': xmlhttp.statusText.trim()
      }));
    } catch (e) {}

    responseText = '';

    try {
      responseText = "\n".concat(Drupal.t('ResponseText: !responseText', {
        '!responseText': xmlhttp.responseText.trim()
      }));
    } catch (e) {}

    responseText = responseText.replace(/<("[^"]*"|'[^']*'|[^'">])*>/gi, '');
    responseText = responseText.replace(/[\n]+\s+/g, '\n');
    var readyStateText = xmlhttp.status === 0 ? "\n".concat(Drupal.t('ReadyState: !readyState', {
      '!readyState': xmlhttp.readyState
    })) : '';
    customMessage = customMessage ? "\n".concat(Drupal.t('CustomMessage: !customMessage', {
      '!customMessage': customMessage
    })) : '';
    this.message = statusCode + pathText + statusText + customMessage + responseText + readyStateText;
    this.name = 'AjaxError';
  };

  Drupal.AjaxError.prototype = new Error();
  Drupal.AjaxError.prototype.constructor = Drupal.AjaxError;

  Drupal.ajax = function (settings) {
    if (arguments.length !== 1) {
      throw new Error('Drupal.ajax() function must be called with one configuration object only');
    }

    var base = settings.base || false;
    var element = settings.element || false;
    delete settings.base;
    delete settings.element;

    if (!settings.progress && !element) {
      settings.progress = false;
    }

    var ajax = new Drupal.Ajax(base, element, settings);
    ajax.instanceIndex = Drupal.ajax.instances.length;
    Drupal.ajax.instances.push(ajax);
    return ajax;
  };

  Drupal.ajax.instances = [];

  Drupal.ajax.expired = function () {
    return Drupal.ajax.instances.filter(function (instance) {
      return instance && instance.element !== false && !document.body.contains(instance.element);
    });
  };

  Drupal.ajax.bindAjaxLinks = function (element) {
    once('ajax', '.use-ajax', element).forEach(function (ajaxLink) {
      var $linkElement = $(ajaxLink);
      var elementSettings = {
        progress: {
          type: 'throbber'
        },
        dialogType: $linkElement.data('dialog-type'),
        dialog: $linkElement.data('dialog-options'),
        dialogRenderer: $linkElement.data('dialog-renderer'),
        base: $linkElement.attr('id'),
        element: ajaxLink
      };
      var href = $linkElement.attr('href');

      if (href) {
        elementSettings.url = href;
        elementSettings.event = 'click';
      }

      Drupal.ajax(elementSettings);
    });
  };

  Drupal.Ajax = function (base, element, elementSettings) {
    var defaults = {
      event: element ? 'mousedown' : null,
      keypress: true,
      selector: base ? "#".concat(base) : null,
      effect: 'none',
      speed: 'none',
      method: 'replaceWith',
      progress: {
        type: 'throbber',
        message: Drupal.t('Please wait...')
      },
      submit: {
        js: true
      }
    };
    $.extend(this, defaults, elementSettings);
    this.commands = new Drupal.AjaxCommands();
    this.instanceIndex = false;

    if (this.wrapper) {
      this.wrapper = "#".concat(this.wrapper);
    }

    this.element = element;
    this.element_settings = elementSettings;
    this.elementSettings = elementSettings;

    if (this.element && this.element.form) {
      this.$form = $(this.element.form);
    }

    if (!this.url) {
      var $element = $(this.element);

      if ($element.is('a')) {
        this.url = $element.attr('href');
      } else if (this.element && element.form) {
        this.url = this.$form.attr('action');
      }
    }

    var originalUrl = this.url;
    this.url = this.url.replace(/\/nojs(\/|$|\?|#)/, '/ajax$1');

    if (drupalSettings.ajaxTrustedUrl[originalUrl]) {
      drupalSettings.ajaxTrustedUrl[this.url] = true;
    }

    var ajax = this;
    ajax.options = {
      url: ajax.url,
      data: ajax.submit,
      beforeSerialize: function beforeSerialize(elementSettings, options) {
        return ajax.beforeSerialize(elementSettings, options);
      },
      beforeSubmit: function beforeSubmit(formValues, elementSettings, options) {
        ajax.ajaxing = true;
        return ajax.beforeSubmit(formValues, elementSettings, options);
      },
      beforeSend: function beforeSend(xmlhttprequest, options) {
        ajax.ajaxing = true;
        return ajax.beforeSend(xmlhttprequest, options);
      },
      success: function success(response, status, xmlhttprequest) {
        if (typeof response === 'string') {
          response = $.parseJSON(response);
        }

        if (response !== null && !drupalSettings.ajaxTrustedUrl[ajax.url]) {
          if (xmlhttprequest.getResponseHeader('X-Drupal-Ajax-Token') !== '1') {
            var customMessage = Drupal.t('The response failed verification so will not be processed.');
            return ajax.error(xmlhttprequest, ajax.url, customMessage);
          }
        }

        return ajax.success(response, status);
      },
      complete: function complete(xmlhttprequest, status) {
        ajax.ajaxing = false;

        if (status === 'error' || status === 'parsererror') {
          return ajax.error(xmlhttprequest, ajax.url);
        }
      },
      dataType: 'json',
      jsonp: false,
      type: 'POST'
    };

    if (elementSettings.dialog) {
      ajax.options.data.dialogOptions = elementSettings.dialog;
    }

    if (ajax.options.url.indexOf('?') === -1) {
      ajax.options.url += '?';
    } else {
      ajax.options.url += '&';
    }

    var wrapper = "drupal_".concat(elementSettings.dialogType || 'ajax');

    if (elementSettings.dialogRenderer) {
      wrapper += ".".concat(elementSettings.dialogRenderer);
    }

    ajax.options.url += "".concat(Drupal.ajax.WRAPPER_FORMAT, "=").concat(wrapper);
    $(ajax.element).on(elementSettings.event, function (event) {
      if (!drupalSettings.ajaxTrustedUrl[ajax.url] && !Drupal.url.isLocal(ajax.url)) {
        throw new Error(Drupal.t('The callback URL is not local and not trusted: !url', {
          '!url': ajax.url
        }));
      }

      return ajax.eventResponse(this, event);
    });

    if (elementSettings.keypress) {
      $(ajax.element).on('keypress', function (event) {
        return ajax.keypressResponse(this, event);
      });
    }

    if (elementSettings.prevent) {
      $(ajax.element).on(elementSettings.prevent, false);
    }
  };

  Drupal.ajax.WRAPPER_FORMAT = '_wrapper_format';
  Drupal.Ajax.AJAX_REQUEST_PARAMETER = '_drupal_ajax';

  Drupal.Ajax.prototype.execute = function () {
    if (this.ajaxing) {
      return;
    }

    try {
      this.beforeSerialize(this.element, this.options);
      return $.ajax(this.options);
    } catch (e) {
      this.ajaxing = false;
      window.alert("An error occurred while attempting to process ".concat(this.options.url, ": ").concat(e.message));
      return $.Deferred().reject();
    }
  };

  Drupal.Ajax.prototype.keypressResponse = function (element, event) {
    var ajax = this;

    if (event.which === 13 || event.which === 32 && element.type !== 'text' && element.type !== 'textarea' && element.type !== 'tel' && element.type !== 'number') {
      event.preventDefault();
      event.stopPropagation();
      $(element).trigger(ajax.elementSettings.event);
    }
  };

  Drupal.Ajax.prototype.eventResponse = function (element, event) {
    event.preventDefault();
    event.stopPropagation();
    var ajax = this;

    if (ajax.ajaxing) {
      return;
    }

    try {
      if (ajax.$form) {
        if (ajax.setClick) {
          element.form.clk = element;
        }

        ajax.$form.ajaxSubmit(ajax.options);
      } else {
        ajax.beforeSerialize(ajax.element, ajax.options);
        $.ajax(ajax.options);
      }
    } catch (e) {
      ajax.ajaxing = false;
      window.alert("An error occurred while attempting to process ".concat(ajax.options.url, ": ").concat(e.message));
    }
  };

  Drupal.Ajax.prototype.beforeSerialize = function (element, options) {
    if (this.$form && document.body.contains(this.$form.get(0))) {
      var settings = this.settings || drupalSettings;
      Drupal.detachBehaviors(this.$form.get(0), settings, 'serialize');
    }

    options.data[Drupal.Ajax.AJAX_REQUEST_PARAMETER] = 1;
    var pageState = drupalSettings.ajaxPageState;
    options.data['ajax_page_state[theme]'] = pageState.theme;
    options.data['ajax_page_state[theme_token]'] = pageState.theme_token;
    options.data['ajax_page_state[libraries]'] = pageState.libraries;
  };

  Drupal.Ajax.prototype.beforeSubmit = function (formValues, element, options) {};

  Drupal.Ajax.prototype.beforeSend = function (xmlhttprequest, options) {
    if (this.$form) {
      options.extraData = options.extraData || {};
      options.extraData.ajax_iframe_upload = '1';
      var v = $.fieldValue(this.element);

      if (v !== null) {
        options.extraData[this.element.name] = v;
      }
    }

    $(this.element).prop('disabled', true);

    if (!this.progress || !this.progress.type) {
      return;
    }

    var progressIndicatorMethod = "setProgressIndicator".concat(this.progress.type.slice(0, 1).toUpperCase()).concat(this.progress.type.slice(1).toLowerCase());

    if (progressIndicatorMethod in this && typeof this[progressIndicatorMethod] === 'function') {
      this[progressIndicatorMethod].call(this);
    }
  };

  Drupal.theme.ajaxProgressThrobber = function (message) {
    var messageMarkup = typeof message === 'string' ? Drupal.theme('ajaxProgressMessage', message) : '';
    var throbber = '<div class="throbber">&nbsp;</div>';
    return "<div class=\"ajax-progress ajax-progress-throbber\">".concat(throbber).concat(messageMarkup, "</div>");
  };

  Drupal.theme.ajaxProgressIndicatorFullscreen = function () {
    return '<div class="ajax-progress ajax-progress-fullscreen">&nbsp;</div>';
  };

  Drupal.theme.ajaxProgressMessage = function (message) {
    return "<div class=\"message\">".concat(message, "</div>");
  };

  Drupal.theme.ajaxProgressBar = function ($element) {
    return $('<div class="ajax-progress ajax-progress-bar"></div>').append($element);
  };

  Drupal.Ajax.prototype.setProgressIndicatorBar = function () {
    var progressBar = new Drupal.ProgressBar("ajax-progress-".concat(this.element.id), $.noop, this.progress.method, $.noop);

    if (this.progress.message) {
      progressBar.setProgress(-1, this.progress.message);
    }

    if (this.progress.url) {
      progressBar.startMonitoring(this.progress.url, this.progress.interval || 1500);
    }

    this.progress.element = $(Drupal.theme('ajaxProgressBar', progressBar.element));
    this.progress.object = progressBar;
    $(this.element).after(this.progress.element);
  };

  Drupal.Ajax.prototype.setProgressIndicatorThrobber = function () {
    this.progress.element = $(Drupal.theme('ajaxProgressThrobber', this.progress.message));
    $(this.element).after(this.progress.element);
  };

  Drupal.Ajax.prototype.setProgressIndicatorFullscreen = function () {
    this.progress.element = $(Drupal.theme('ajaxProgressIndicatorFullscreen'));
    $('body').append(this.progress.element);
  };

  Drupal.Ajax.prototype.success = function (response, status) {
    var _this = this;

    if (this.progress.element) {
      $(this.progress.element).remove();
    }

    if (this.progress.object) {
      this.progress.object.stopMonitoring();
    }

    $(this.element).prop('disabled', false);
    var elementParents = $(this.element).parents('[data-drupal-selector]').addBack().toArray();
    var focusChanged = false;
    Object.keys(response || {}).forEach(function (i) {
      if (response[i].command && _this.commands[response[i].command]) {
        _this.commands[response[i].command](_this, response[i], status);

        if (response[i].command === 'invoke' && response[i].method === 'focus' || response[i].command === 'focusFirst') {
          focusChanged = true;
        }
      }
    });

    if (!focusChanged && this.element && !$(this.element).data('disable-refocus')) {
      var target = false;

      for (var n = elementParents.length - 1; !target && n >= 0; n--) {
        target = document.querySelector("[data-drupal-selector=\"".concat(elementParents[n].getAttribute('data-drupal-selector'), "\"]"));
      }

      if (target) {
        $(target).trigger('focus');
      }
    }

    if (this.$form && document.body.contains(this.$form.get(0))) {
      var settings = this.settings || drupalSettings;
      Drupal.attachBehaviors(this.$form.get(0), settings);
    }

    this.settings = null;
  };

  Drupal.Ajax.prototype.getEffect = function (response) {
    var type = response.effect || this.effect;
    var speed = response.speed || this.speed;
    var effect = {};

    if (type === 'none') {
      effect.showEffect = 'show';
      effect.hideEffect = 'hide';
      effect.showSpeed = '';
    } else if (type === 'fade') {
      effect.showEffect = 'fadeIn';
      effect.hideEffect = 'fadeOut';
      effect.showSpeed = speed;
    } else {
      effect.showEffect = "".concat(type, "Toggle");
      effect.hideEffect = "".concat(type, "Toggle");
      effect.showSpeed = speed;
    }

    return effect;
  };

  Drupal.Ajax.prototype.error = function (xmlhttprequest, uri, customMessage) {
    if (this.progress.element) {
      $(this.progress.element).remove();
    }

    if (this.progress.object) {
      this.progress.object.stopMonitoring();
    }

    $(this.wrapper).show();
    $(this.element).prop('disabled', false);

    if (this.$form && document.body.contains(this.$form.get(0))) {
      var settings = this.settings || drupalSettings;
      Drupal.attachBehaviors(this.$form.get(0), settings);
    }

    throw new Drupal.AjaxError(xmlhttprequest, uri, customMessage);
  };

  Drupal.theme.ajaxWrapperNewContent = function ($newContent, ajax, response) {
    return (response.effect || ajax.effect) !== 'none' && $newContent.filter(function (i) {
      return !($newContent[i].nodeName === '#comment' || $newContent[i].nodeName === '#text' && /^(\s|\n|\r)*$/.test($newContent[i].textContent));
    }).length > 1 ? Drupal.theme('ajaxWrapperMultipleRootElements', $newContent) : $newContent;
  };

  Drupal.theme.ajaxWrapperMultipleRootElements = function ($elements) {
    return $('<div></div>').append($elements);
  };

  Drupal.AjaxCommands = function () {};

  Drupal.AjaxCommands.prototype = {
    insert: function insert(ajax, response) {
      var $wrapper = response.selector ? $(response.selector) : $(ajax.wrapper);
      var method = response.method || ajax.method;
      var effect = ajax.getEffect(response);
      var settings = response.settings || ajax.settings || drupalSettings;
      var $newContent = $($.parseHTML(response.data, document, true));
      $newContent = Drupal.theme('ajaxWrapperNewContent', $newContent, ajax, response);

      switch (method) {
        case 'html':
        case 'replaceWith':
        case 'replaceAll':
        case 'empty':
        case 'remove':
          Drupal.detachBehaviors($wrapper.get(0), settings);
          break;

        default:
          break;
      }

      $wrapper[method]($newContent);

      if (effect.showEffect !== 'show') {
        $newContent.hide();
      }

      var $ajaxNewContent = $newContent.find('.ajax-new-content');

      if ($ajaxNewContent.length) {
        $ajaxNewContent.hide();
        $newContent.show();
        $ajaxNewContent[effect.showEffect](effect.showSpeed);
      } else if (effect.showEffect !== 'show') {
        $newContent[effect.showEffect](effect.showSpeed);
      }

      if ($newContent.parents('html').length) {
        $newContent.each(function (index, element) {
          if (element.nodeType === Node.ELEMENT_NODE) {
            Drupal.attachBehaviors(element, settings);
          }
        });
      }
    },
    remove: function remove(ajax, response, status) {
      var settings = response.settings || ajax.settings || drupalSettings;
      $(response.selector).each(function () {
        Drupal.detachBehaviors(this, settings);
      }).remove();
    },
    changed: function changed(ajax, response, status) {
      var $element = $(response.selector);

      if (!$element.hasClass('ajax-changed')) {
        $element.addClass('ajax-changed');

        if (response.asterisk) {
          $element.find(response.asterisk).append(" <abbr class=\"ajax-changed\" title=\"".concat(Drupal.t('Changed'), "\">*</abbr> "));
        }
      }
    },
    alert: function alert(ajax, response, status) {
      window.alert(response.text);
    },
    announce: function announce(ajax, response) {
      if (response.priority) {
        Drupal.announce(response.text, response.priority);
      } else {
        Drupal.announce(response.text);
      }
    },
    redirect: function redirect(ajax, response, status) {
      window.location = response.url;
    },
    css: function css(ajax, response, status) {
      $(response.selector).css(response.argument);
    },
    settings: function settings(ajax, response, status) {
      var ajaxSettings = drupalSettings.ajax;

      if (ajaxSettings) {
        Drupal.ajax.expired().forEach(function (instance) {
          if (instance.selector) {
            var selector = instance.selector.replace('#', '');

            if (selector in ajaxSettings) {
              delete ajaxSettings[selector];
            }
          }
        });
      }

      if (response.merge) {
        $.extend(true, drupalSettings, response.settings);
      } else {
        ajax.settings = response.settings;
      }
    },
    data: function data(ajax, response, status) {
      $(response.selector).data(response.name, response.value);
    },
    focusFirst: function focusFirst(ajax, response, status) {
      var focusChanged = false;
      var container = document.querySelector(response.selector);

      if (container) {
        var tabbableElements = tabbable(container);

        if (tabbableElements.length) {
          tabbableElements[0].focus();
          focusChanged = true;
        } else if (isFocusable(container)) {
          container.focus();
          focusChanged = true;
        }
      }

      if (ajax.hasOwnProperty('element') && !focusChanged) {
        ajax.element.focus();
      }
    },
    invoke: function invoke(ajax, response, status) {
      var $element = $(response.selector);
      $element[response.method].apply($element, _toConsumableArray(response.args));
    },
    restripe: function restripe(ajax, response, status) {
      $(response.selector).find('> tbody > tr:visible, > tr:visible').removeClass('odd even').filter(':even').addClass('odd').end().filter(':odd').addClass('even');
    },
    update_build_id: function update_build_id(ajax, response, status) {
      $("input[name=\"form_build_id\"][value=\"".concat(response.old, "\"]")).val(response.new);
    },
    add_css: function add_css(ajax, response, status) {
      $('head').prepend(response.data);
    },
    message: function message(ajax, response) {
      var messages = new Drupal.Message(document.querySelector(response.messageWrapperQuerySelector));

      if (response.clearPrevious) {
        messages.clear();
      }

      messages.add(response.message, response.messageOptions);
    }
  };
})(jQuery, window, Drupal, drupalSettings, window.tabbable);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function (Drupal, drupalSettings) {
  Drupal.behaviors.activeLinks = {
    attach: function attach(context) {
      var path = drupalSettings.path;
      var queryString = JSON.stringify(path.currentQuery);
      var querySelector = path.currentQuery ? "[data-drupal-link-query='".concat(queryString, "']") : ':not([data-drupal-link-query])';
      var originalSelectors = ["[data-drupal-link-system-path=\"".concat(path.currentPath, "\"]")];
      var selectors;

      if (path.isFront) {
        originalSelectors.push('[data-drupal-link-system-path="<front>"]');
      }

      selectors = [].concat(originalSelectors.map(function (selector) {
        return "".concat(selector, ":not([hreflang])");
      }), originalSelectors.map(function (selector) {
        return "".concat(selector, "[hreflang=\"").concat(path.currentLanguage, "\"]");
      }));
      selectors = selectors.map(function (current) {
        return current + querySelector;
      });
      var activeLinks = context.querySelectorAll(selectors.join(','));
      var il = activeLinks.length;

      for (var i = 0; i < il; i++) {
        activeLinks[i].classList.add('is-active');
      }
    },
    detach: function detach(context, settings, trigger) {
      if (trigger === 'unload') {
        var activeLinks = context.querySelectorAll('[data-drupal-link-system-path].is-active');
        var il = activeLinks.length;

        for (var i = 0; i < il; i++) {
          activeLinks[i].classList.remove('is-active');
        }
      }
    }
  };
})(Drupal, drupalSettings);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

Drupal.debounce = function (func, wait, immediate) {
  var timeout;
  var result;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var context = this;

    var later = function later() {
      timeout = null;

      if (!immediate) {
        result = func.apply(context, args);
      }
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      result = func.apply(context, args);
    }

    return result;
  };
};;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, debounce) {
  $.fn.drupalGetSummary = function () {
    var callback = this.data('summaryCallback');
    return this[0] && callback ? callback(this[0]).trim() : '';
  };

  $.fn.drupalSetSummary = function (callback) {
    var self = this;

    if (typeof callback !== 'function') {
      var val = callback;

      callback = function callback() {
        return val;
      };
    }

    return this.data('summaryCallback', callback).off('formUpdated.summary').on('formUpdated.summary', function () {
      self.trigger('summaryUpdated');
    }).trigger('summaryUpdated');
  };

  Drupal.behaviors.formSingleSubmit = {
    attach: function attach() {
      function onFormSubmit(e) {
        var $form = $(e.currentTarget);
        var formValues = $form.serialize();
        var previousValues = $form.attr('data-drupal-form-submit-last');

        if (previousValues === formValues) {
          e.preventDefault();
        } else {
          $form.attr('data-drupal-form-submit-last', formValues);
        }
      }

      $(once('form-single-submit', 'body')).on('submit.singleSubmit', 'form:not([method~="GET"])', onFormSubmit);
    }
  };

  function triggerFormUpdated(element) {
    $(element).trigger('formUpdated');
  }

  function fieldsList(form) {
    var $fieldList = $(form).find('[name]').map(function (index, element) {
      return element.getAttribute('id');
    });
    return $.makeArray($fieldList);
  }

  Drupal.behaviors.formUpdated = {
    attach: function attach(context) {
      var $context = $(context);
      var contextIsForm = $context.is('form');
      var $forms = $(once('form-updated', contextIsForm ? $context : $context.find('form')));
      var formFields;

      if ($forms.length) {
        $.makeArray($forms).forEach(function (form) {
          var events = 'change.formUpdated input.formUpdated ';
          var eventHandler = debounce(function (event) {
            triggerFormUpdated(event.target);
          }, 300);
          formFields = fieldsList(form).join(',');
          form.setAttribute('data-drupal-form-fields', formFields);
          $(form).on(events, eventHandler);
        });
      }

      if (contextIsForm) {
        formFields = fieldsList(context).join(',');
        var currentFields = $(context).attr('data-drupal-form-fields');

        if (formFields !== currentFields) {
          triggerFormUpdated(context);
        }
      }
    },
    detach: function detach(context, settings, trigger) {
      var $context = $(context);
      var contextIsForm = $context.is('form');

      if (trigger === 'unload') {
        once.remove('form-updated', contextIsForm ? $context : $context.find('form')).forEach(function (form) {
          form.removeAttribute('data-drupal-form-fields');
          $(form).off('.formUpdated');
        });
      }
    }
  };
  Drupal.behaviors.fillUserInfoFromBrowser = {
    attach: function attach(context, settings) {
      var userInfo = ['name', 'mail', 'homepage'];
      var $forms = $(once('user-info-from-browser', '[data-user-info-from-browser]'));

      if ($forms.length) {
        userInfo.forEach(function (info) {
          var $element = $forms.find("[name=".concat(info, "]"));
          var browserData = localStorage.getItem("Drupal.visitor.".concat(info));
          var emptyOrDefault = $element.val() === '' || $element.attr('data-drupal-default-value') === $element.val();

          if ($element.length && emptyOrDefault && browserData) {
            $element.val(browserData);
          }
        });
      }

      $forms.on('submit', function () {
        userInfo.forEach(function (info) {
          var $element = $forms.find("[name=".concat(info, "]"));

          if ($element.length) {
            localStorage.setItem("Drupal.visitor.".concat(info), $element.val());
          }
        });
      });
    }
  };

  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e) {
    var url;

    if (e.type === 'click') {
      url = e.currentTarget.location ? e.currentTarget.location : e.currentTarget;
    } else {
      url = window.location;
    }

    var hash = url.hash.substr(1);

    if (hash) {
      var $target = $("#".concat(hash));
      $('body').trigger('formFragmentLinkClickOrHashChange', [$target]);
      setTimeout(function () {
        return $target.trigger('focus');
      }, 300);
    }
  };

  var debouncedHandleFragmentLinkClickOrHashChange = debounce(handleFragmentLinkClickOrHashChange, 300, true);
  $(window).on('hashchange.form-fragment', debouncedHandleFragmentLinkClickOrHashChange);
  $(document).on('click.form-fragment', 'a[href*="#"]', debouncedHandleFragmentLinkClickOrHashChange);
})(jQuery, Drupal, Drupal.debounce);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.entityContentDetailsSummaries = {
    attach: function attach(context) {
      var $context = $(context);
      $context.find('.entity-content-form-revision-information').drupalSetSummary(function (context) {
        var $revisionContext = $(context);
        var revisionCheckbox = $revisionContext.find('.js-form-item-revision input');

        if (revisionCheckbox.is(':checked') || !revisionCheckbox.length && $revisionContext.find('.js-form-item-revision-log textarea').length) {
          return Drupal.t('New revision');
        }

        return Drupal.t('No revision');
      });
      $context.find('details.entity-translation-options').drupalSetSummary(function (context) {
        var $translationContext = $(context);
        var translate;
        var $checkbox = $translationContext.find('.js-form-item-translation-translate input');

        if ($checkbox.length) {
          translate = $checkbox.is(':checked') ? Drupal.t('Needs to be updated') : Drupal.t('Does not need to be updated');
        } else {
          $checkbox = $translationContext.find('.js-form-item-translation-retranslate input');
          translate = $checkbox.is(':checked') ? Drupal.t('Flag other translations as outdated') : Drupal.t('Do not flag other translations as outdated');
        }

        return translate;
      });
    }
  };
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.nodeDetailsSummaries = {
    attach: function attach(context) {
      var $context = $(context);
      $context.find('.node-form-author').drupalSetSummary(function (context) {
        var $authorContext = $(context);
        var name = $authorContext.find('.field--name-uid input').val();
        var date = $authorContext.find('.field--name-created input').val();

        if (name && date) {
          return Drupal.t('By @name on @date', {
            '@name': name,
            '@date': date
          });
        }

        if (name) {
          return Drupal.t('By @name', {
            '@name': name
          });
        }

        if (date) {
          return Drupal.t('Authored on @date', {
            '@date': date
          });
        }
      });
      $context.find('.node-form-options').drupalSetSummary(function (context) {
        var $optionsContext = $(context);
        var vals = [];

        if ($optionsContext.find('input').is(':checked')) {
          $optionsContext.find('input:checked').next('label').each(function () {
            vals.push(Drupal.checkPlain($(this).text().trim()));
          });
          return vals.join(', ');
        }

        return Drupal.t('Not promoted');
      });
    }
  };
})(jQuery, Drupal, drupalSettings);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  function DetailsSummarizedContent(node) {
    this.$node = $(node);
    this.setupSummary();
  }

  $.extend(DetailsSummarizedContent, {
    instances: []
  });
  $.extend(DetailsSummarizedContent.prototype, {
    setupSummary: function setupSummary() {
      this.$detailsSummarizedContentWrapper = $(Drupal.theme('detailsSummarizedContentWrapper'));
      this.$node.on('summaryUpdated', $.proxy(this.onSummaryUpdated, this)).trigger('summaryUpdated').find('> summary').append(this.$detailsSummarizedContentWrapper);
    },
    onSummaryUpdated: function onSummaryUpdated() {
      var text = this.$node.drupalGetSummary();
      this.$detailsSummarizedContentWrapper.html(Drupal.theme('detailsSummarizedContentText', text));
    }
  });
  Drupal.behaviors.detailsSummary = {
    attach: function attach(context) {
      DetailsSummarizedContent.instances = DetailsSummarizedContent.instances.concat(once('details', 'details', context).map(function (details) {
        return new DetailsSummarizedContent(details);
      }));
    }
  };
  Drupal.DetailsSummarizedContent = DetailsSummarizedContent;

  Drupal.theme.detailsSummarizedContentWrapper = function () {
    return "<span class=\"summary\"></span>";
  };

  Drupal.theme.detailsSummarizedContentText = function (text) {
    return text ? " (".concat(text, ")") : '';
  };
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.detailsAria = {
    attach: function attach() {
      $(once('detailsAria', 'body')).on('click.detailsAria', 'summary', function (event) {
        var $summary = $(event.currentTarget);
        var open = $(event.currentTarget.parentNode).attr('open') === 'open' ? 'false' : 'true';
        $summary.attr({
          'aria-expanded': open,
          'aria-pressed': open
        });
      });
    }
  };
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Modernizr, Drupal) {
  function CollapsibleDetails(node) {
    this.$node = $(node);
    this.$node.data('details', this);
    var anchor = window.location.hash && window.location.hash !== '#' ? ", ".concat(window.location.hash) : '';

    if (this.$node.find(".error".concat(anchor)).length) {
      this.$node.attr('open', true);
    }

    this.setupSummaryPolyfill();
  }

  $.extend(CollapsibleDetails, {
    instances: []
  });
  $.extend(CollapsibleDetails.prototype, {
    setupSummaryPolyfill: function setupSummaryPolyfill() {
      var $summary = this.$node.find('> summary');
      $summary.attr('tabindex', '-1');
      $('<span class="details-summary-prefix visually-hidden"></span>').append(this.$node.attr('open') ? Drupal.t('Hide') : Drupal.t('Show')).prependTo($summary).after(document.createTextNode(' '));
      $('<a class="details-title"></a>').attr('href', "#".concat(this.$node.attr('id'))).prepend($summary.contents()).appendTo($summary);
      $summary.append(this.$summary).on('click', $.proxy(this.onSummaryClick, this));
    },
    onSummaryClick: function onSummaryClick(e) {
      this.toggle();
      e.preventDefault();
    },
    toggle: function toggle() {
      var _this = this;

      var isOpen = !!this.$node.attr('open');
      var $summaryPrefix = this.$node.find('> summary span.details-summary-prefix');

      if (isOpen) {
        $summaryPrefix.html(Drupal.t('Show'));
      } else {
        $summaryPrefix.html(Drupal.t('Hide'));
      }

      setTimeout(function () {
        _this.$node.attr('open', !isOpen);
      }, 0);
    }
  });
  Drupal.behaviors.collapse = {
    attach: function attach(context) {
      if (Modernizr.details) {
        return;
      }

      once('collapse', 'details', context).forEach(function (detail) {
        detail.classList.add('collapse-processed');
        CollapsibleDetails.instances.push(new CollapsibleDetails(detail));
      });
    }
  };

  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e, $target) {
    $target.parents('details').not('[open]').find('> summary').trigger('click');
  };

  $('body').on('formFragmentLinkClickOrHashChange.details', handleFragmentLinkClickOrHashChange);
  Drupal.CollapsibleDetails = CollapsibleDetails;
})(jQuery, Modernizr, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

(function (Modernizr, Drupal, once) {
  Drupal.behaviors.date = {
    attach: function attach(context, settings) {
      if (Modernizr.inputtypes.date === false) {
        once('datepicker', '[data-drupal-field-elements="date-time"]').forEach(function (dateTime) {
          var dateInput = dateTime.querySelector('input[type="date"]');
          var timeInput = dateTime.querySelector('input[type="time"]');
          var help = Drupal.theme.dateTimeHelp({
            dateId: "".concat(dateInput.id, "--description"),
            dateDesc: dateInput.dataset.help,
            timeId: "".concat(timeInput.id, "--description"),
            timeDesc: timeInput.dataset.help
          });
          [dateInput, timeInput].forEach(function (input) {
            input.setAttribute('aria-describedby', "".concat(input.id, "--description"));
            input.setAttribute('type', 'text');
          });
          Drupal.DatepickerPolyfill.attachDescription(dateTime, help);
        });
        once('datepicker', '[data-drupal-field-elements="date"]').forEach(function (date) {
          var dateInput = date.querySelector('input[type="date"]');
          var help = Drupal.theme.dateHelp({
            dateDesc: dateInput.dataset.help
          });
          var id = "".concat(date.id, "--description");
          dateInput.setAttribute('aria-describedby', id);
          dateInput.setAttribute('type', 'text');
          Drupal.DatepickerPolyfill.attachDescription(date, help, id);
        });
      }
    }
  };

  Drupal.DatepickerPolyfill = function () {
    function _class() {
      _classCallCheck(this, _class);
    }

    _createClass(_class, null, [{
      key: "attachDescription",
      value: function attachDescription(element, help, id) {
        var description = element.nextElementSibling;

        if (!(description && description.getAttribute('data-drupal-field-elements') === 'description')) {
          description = Drupal.DatepickerPolyfill.descriptionWrapperElement(id);
          element.parentNode.insertBefore(description, element.nextSibling);
        }

        description.insertAdjacentHTML('beforeend', help);
      }
    }, {
      key: "descriptionWrapperElement",
      value: function descriptionWrapperElement(id) {
        var description = document.createElement('div');
        description.classList.add('description');
        description.setAttribute('data-drupal-field-elements', 'description');

        if (id) {
          description.setAttribute('id', id);
        }

        return description;
      }
    }]);

    return _class;
  }();

  Drupal.theme.dateHelp = function (_ref) {
    var dateDesc = _ref.dateDesc;
    return "<div class=\"no-native-datepicker-help\">".concat(dateDesc, "</div>");
  };

  Drupal.theme.dateTimeHelp = function (_ref2) {
    var dateId = _ref2.dateId,
        timeId = _ref2.timeId,
        dateDesc = _ref2.dateDesc,
        timeDesc = _ref2.timeDesc;
    return "<div class=\"no-native-datepicker-help\">\n       <span id=\"".concat(dateId, "\">").concat(dateDesc, "</span> <span id=\"").concat(timeId, "\">").concat(timeDesc, "</span>\n     </div>");
  };
})(Modernizr, Drupal, once);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, _ref) {
  var isTabbable = _ref.isTabbable;
  $.extend($.expr[':'], {
    tabbable: function tabbable(element) {
      Drupal.deprecationError({
        message: 'The :tabbable selector is deprecated in Drupal 9.2.0 and will be removed in Drupal 10.0.0. Use the core/tabbable library instead. See https://www.drupal.org/node/3183730'
      });

      if (element.tagName === 'SUMMARY' || element.tagName === 'DETAILS') {
        var tabIndex = element.getAttribute('tabIndex');

        if (tabIndex === null || tabIndex < 0) {
          return false;
        }
      }

      return isTabbable(element);
    }
  });
})(jQuery, Drupal, window.tabbable);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($) {
  var cachedScrollbarWidth = null;
  var max = Math.max,
      abs = Math.abs;
  var regexHorizontal = /left|center|right/;
  var regexVertical = /top|center|bottom/;
  var regexOffset = /[+-]\d+(\.[\d]+)?%?/;
  var regexPosition = /^\w+/;
  var regexPercent = /%$/;
  var _position = $.fn.position;

  function getOffsets(offsets, width, height) {
    return [parseFloat(offsets[0]) * (regexPercent.test(offsets[0]) ? width / 100 : 1), parseFloat(offsets[1]) * (regexPercent.test(offsets[1]) ? height / 100 : 1)];
  }

  function parseCss(element, property) {
    return parseInt($.css(element, property), 10) || 0;
  }

  function getDimensions(elem) {
    var raw = elem[0];

    if (raw.nodeType === 9) {
      return {
        width: elem.width(),
        height: elem.height(),
        offset: {
          top: 0,
          left: 0
        }
      };
    }

    if ($.isWindow(raw)) {
      return {
        width: elem.width(),
        height: elem.height(),
        offset: {
          top: elem.scrollTop(),
          left: elem.scrollLeft()
        }
      };
    }

    if (raw.preventDefault) {
      return {
        width: 0,
        height: 0,
        offset: {
          top: raw.pageY,
          left: raw.pageX
        }
      };
    }

    return {
      width: elem.outerWidth(),
      height: elem.outerHeight(),
      offset: elem.offset()
    };
  }

  var collisions = {
    fit: {
      left: function left(position, data) {
        var within = data.within;
        var withinOffset = within.isWindow ? within.scrollLeft : within.offset.left;
        var outerWidth = within.width;
        var collisionPosLeft = position.left - data.collisionPosition.marginLeft;
        var overLeft = withinOffset - collisionPosLeft;
        var overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset;
        var newOverRight;

        if (data.collisionWidth > outerWidth) {
          if (overLeft > 0 && overRight <= 0) {
            newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
            position.left += overLeft - newOverRight;
          } else if (overRight > 0 && overLeft <= 0) {
            position.left = withinOffset;
          } else if (overLeft > overRight) {
            position.left = withinOffset + outerWidth - data.collisionWidth;
          } else {
            position.left = withinOffset;
          }
        } else if (overLeft > 0) {
          position.left += overLeft;
        } else if (overRight > 0) {
          position.left -= overRight;
        } else {
          position.left = max(position.left - collisionPosLeft, position.left);
        }
      },
      top: function top(position, data) {
        var within = data.within;
        var withinOffset = within.isWindow ? within.scrollTop : within.offset.top;
        var outerHeight = data.within.height;
        var collisionPosTop = position.top - data.collisionPosition.marginTop;
        var overTop = withinOffset - collisionPosTop;
        var overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset;
        var newOverBottom;

        if (data.collisionHeight > outerHeight) {
          if (overTop > 0 && overBottom <= 0) {
            newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
            position.top += overTop - newOverBottom;
          } else if (overBottom > 0 && overTop <= 0) {
            position.top = withinOffset;
          } else if (overTop > overBottom) {
            position.top = withinOffset + outerHeight - data.collisionHeight;
          } else {
            position.top = withinOffset;
          }
        } else if (overTop > 0) {
          position.top += overTop;
        } else if (overBottom > 0) {
          position.top -= overBottom;
        } else {
          position.top = max(position.top - collisionPosTop, position.top);
        }
      }
    },
    flip: {
      left: function left(position, data) {
        var within = data.within;
        var withinOffset = within.offset.left + within.scrollLeft;
        var outerWidth = within.width;
        var offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left;
        var collisionPosLeft = position.left - data.collisionPosition.marginLeft;
        var overLeft = collisionPosLeft - offsetLeft;
        var overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft;
        var myOffset = data.my[0] === 'left' ? -data.elemWidth : data.my[0] === 'right' ? data.elemWidth : 0;
        var atOffset = data.at[0] === 'left' ? data.targetWidth : data.at[0] === 'right' ? -data.targetWidth : 0;
        var offset = -2 * data.offset[0];
        var newOverRight;
        var newOverLeft;

        if (overLeft < 0) {
          newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;

          if (newOverRight < 0 || newOverRight < abs(overLeft)) {
            position.left += myOffset + atOffset + offset;
          }
        } else if (overRight > 0) {
          newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;

          if (newOverLeft > 0 || abs(newOverLeft) < overRight) {
            position.left += myOffset + atOffset + offset;
          }
        }
      },
      top: function top(position, data) {
        var within = data.within;
        var withinOffset = within.offset.top + within.scrollTop;
        var outerHeight = within.height;
        var offsetTop = within.isWindow ? within.scrollTop : within.offset.top;
        var collisionPosTop = position.top - data.collisionPosition.marginTop;
        var overTop = collisionPosTop - offsetTop;
        var overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop;
        var top = data.my[1] === 'top';
        var myOffset = top ? -data.elemHeight : data.my[1] === 'bottom' ? data.elemHeight : 0;
        var atOffset = data.at[1] === 'top' ? data.targetHeight : data.at[1] === 'bottom' ? -data.targetHeight : 0;
        var offset = -2 * data.offset[1];
        var newOverTop;
        var newOverBottom;

        if (overTop < 0) {
          newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;

          if (newOverBottom < 0 || newOverBottom < abs(overTop)) {
            position.top += myOffset + atOffset + offset;
          }
        } else if (overBottom > 0) {
          newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;

          if (newOverTop > 0 || abs(newOverTop) < overBottom) {
            position.top += myOffset + atOffset + offset;
          }
        }
      }
    },
    flipfit: {
      left: function left() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        collisions.flip.left.apply(this, args);
        collisions.fit.left.apply(this, args);
      },
      top: function top() {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        collisions.flip.top.apply(this, args);
        collisions.fit.top.apply(this, args);
      }
    }
  };
  $.position = {
    scrollbarWidth: function scrollbarWidth() {
      if (cachedScrollbarWidth !== undefined) {
        return cachedScrollbarWidth;
      }

      var div = $('<div ' + "style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'>" + "<div style='height:100px;width:auto;'></div></div>");
      var innerDiv = div.children()[0];
      $('body').append(div);
      var w1 = innerDiv.offsetWidth;
      div.css('overflow', 'scroll');
      var w2 = innerDiv.offsetWidth;

      if (w1 === w2) {
        w2 = div[0].clientWidth;
      }

      div.remove();
      cachedScrollbarWidth = w1 - w2;
      return cachedScrollbarWidth;
    },
    getScrollInfo: function getScrollInfo(within) {
      var overflowX = within.isWindow || within.isDocument ? '' : within.element.css('overflow-x');
      var overflowY = within.isWindow || within.isDocument ? '' : within.element.css('overflow-y');
      var hasOverflowX = overflowX === 'scroll' || overflowX === 'auto' && within.width < within.element[0].scrollWidth;
      var hasOverflowY = overflowY === 'scroll' || overflowY === 'auto' && within.height < within.element[0].scrollHeight;
      return {
        width: hasOverflowY ? $.position.scrollbarWidth() : 0,
        height: hasOverflowX ? $.position.scrollbarWidth() : 0
      };
    },
    getWithinInfo: function getWithinInfo(element) {
      var withinElement = $(element || window);
      var isWindow = $.isWindow(withinElement[0]);
      var isDocument = !!withinElement[0] && withinElement[0].nodeType === 9;
      var hasOffset = !isWindow && !isDocument;
      return {
        element: withinElement,
        isWindow: isWindow,
        isDocument: isDocument,
        offset: hasOffset ? $(element).offset() : {
          left: 0,
          top: 0
        },
        scrollLeft: withinElement.scrollLeft(),
        scrollTop: withinElement.scrollTop(),
        width: withinElement.outerWidth(),
        height: withinElement.outerHeight()
      };
    }
  };

  $.fn.position = function (options) {
    if (!options || !options.of) {
      return _position.apply(this, arguments);
    }

    options = $.extend({}, options);
    var within = $.position.getWithinInfo(options.within);
    var scrollInfo = $.position.getScrollInfo(within);
    var collision = (options.collision || 'flip').split(' ');
    var offsets = {};
    var target = $(options.of);
    var dimensions = getDimensions(target);
    var targetWidth = dimensions.width;
    var targetHeight = dimensions.height;
    var targetOffset = dimensions.offset;

    if (target[0].preventDefault) {
      options.at = 'left top';
    }

    var basePosition = $.extend({}, targetOffset);
    $.each(['my', 'at'], function () {
      var pos = (options[this] || '').split(' ');

      if (pos.length === 1) {
        pos = regexHorizontal.test(pos[0]) ? pos.concat(['center']) : regexVertical.test(pos[0]) ? ['center'].concat(pos) : ['center', 'center'];
      }

      pos[0] = regexHorizontal.test(pos[0]) ? pos[0] : 'center';
      pos[1] = regexVertical.test(pos[1]) ? pos[1] : 'center';
      var horizontalOffset = regexOffset.exec(pos[0]);
      var verticalOffset = regexOffset.exec(pos[1]);
      offsets[this] = [horizontalOffset ? horizontalOffset[0] : 0, verticalOffset ? verticalOffset[0] : 0];
      options[this] = [regexPosition.exec(pos[0])[0], regexPosition.exec(pos[1])[0]];
    });

    if (collision.length === 1) {
      collision[1] = collision[0];
    }

    if (options.at[0] === 'right') {
      basePosition.left += targetWidth;
    } else if (options.at[0] === 'center') {
      basePosition.left += targetWidth / 2;
    }

    if (options.at[1] === 'bottom') {
      basePosition.top += targetHeight;
    } else if (options.at[1] === 'center') {
      basePosition.top += targetHeight / 2;
    }

    var atOffset = getOffsets(offsets.at, targetWidth, targetHeight);
    basePosition.left += atOffset[0];
    basePosition.top += atOffset[1];
    return this.each(function () {
      var using;
      var elem = $(this);
      var elemWidth = elem.outerWidth();
      var elemHeight = elem.outerHeight();
      var marginLeft = parseCss(this, 'marginLeft');
      var marginTop = parseCss(this, 'marginTop');
      var collisionWidth = elemWidth + marginLeft + parseCss(this, 'marginRight') + scrollInfo.width;
      var collisionHeight = elemHeight + marginTop + parseCss(this, 'marginBottom') + scrollInfo.height;
      var position = $.extend({}, basePosition);
      var myOffset = getOffsets(offsets.my, elem.outerWidth(), elem.outerHeight());

      if (options.my[0] === 'right') {
        position.left -= elemWidth;
      } else if (options.my[0] === 'center') {
        position.left -= elemWidth / 2;
      }

      if (options.my[1] === 'bottom') {
        position.top -= elemHeight;
      } else if (options.my[1] === 'center') {
        position.top -= elemHeight / 2;
      }

      position.left += myOffset[0];
      position.top += myOffset[1];
      var collisionPosition = {
        marginLeft: marginLeft,
        marginTop: marginTop
      };
      $.each(['left', 'top'], function (i, dir) {
        if (collisions[collision[i]]) {
          collisions[collision[i]][dir](position, {
            targetWidth: targetWidth,
            targetHeight: targetHeight,
            elemWidth: elemWidth,
            elemHeight: elemHeight,
            collisionPosition: collisionPosition,
            collisionWidth: collisionWidth,
            collisionHeight: collisionHeight,
            offset: [atOffset[0] + myOffset[0], atOffset[1] + myOffset[1]],
            my: options.my,
            at: options.at,
            within: within,
            elem: elem
          });
        }
      });

      if (options.using) {
        using = function using(props) {
          var left = targetOffset.left - position.left;
          var right = left + targetWidth - elemWidth;
          var top = targetOffset.top - position.top;
          var bottom = top + targetHeight - elemHeight;
          var feedback = {
            target: {
              element: target,
              left: targetOffset.left,
              top: targetOffset.top,
              width: targetWidth,
              height: targetHeight
            },
            element: {
              element: elem,
              left: position.left,
              top: position.top,
              width: elemWidth,
              height: elemHeight
            },
            horizontal: right < 0 ? 'left' : left > 0 ? 'right' : 'center',
            vertical: bottom < 0 ? 'top' : top > 0 ? 'bottom' : 'middle'
          };

          if (targetWidth < elemWidth && abs(left + right) < targetWidth) {
            feedback.horizontal = 'center';
          }

          if (targetHeight < elemHeight && abs(top + bottom) < targetHeight) {
            feedback.vertical = 'middle';
          }

          if (max(abs(left), abs(right)) > max(abs(top), abs(bottom))) {
            feedback.important = 'horizontal';
          } else {
            feedback.important = 'vertical';
          }

          options.using.call(this, props, feedback);
        };
      }

      elem.offset($.extend(position, {
        using: using
      }));
    });
  };

  if (!$.hasOwnProperty('ui')) {
    $.ui = {};
  }

  $.ui.position = collisions;
})(jQuery);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.pathDetailsSummaries = {
    attach: function attach(context) {
      $(context).find('.path-form').drupalSetSummary(function (context) {
        var path = $('.js-form-item-path-0-alias input').val();
        return path ? Drupal.t('Alias: @alias', {
          '@alias': path
        }) : Drupal.t('No alias');
      });
    }
  };
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  var states = {
    postponed: []
  };
  Drupal.states = states;

  function invert(a, invertState) {
    return invertState && typeof a !== 'undefined' ? !a : a;
  }

  function _compare2(a, b) {
    if (a === b) {
      return typeof a === 'undefined' ? a : true;
    }

    return typeof a === 'undefined' || typeof b === 'undefined';
  }

  function ternary(a, b) {
    if (typeof a === 'undefined') {
      return b;
    }

    if (typeof b === 'undefined') {
      return a;
    }

    return a && b;
  }

  Drupal.behaviors.states = {
    attach: function attach(context, settings) {
      var $states = $(context).find('[data-drupal-states]');
      var il = $states.length;

      var _loop = function _loop(i) {
        var config = JSON.parse($states[i].getAttribute('data-drupal-states'));
        Object.keys(config || {}).forEach(function (state) {
          new states.Dependent({
            element: $($states[i]),
            state: states.State.sanitize(state),
            constraints: config[state]
          });
        });
      };

      for (var i = 0; i < il; i++) {
        _loop(i);
      }

      while (states.postponed.length) {
        states.postponed.shift()();
      }
    }
  };

  states.Dependent = function (args) {
    var _this = this;

    $.extend(this, {
      values: {},
      oldValue: null
    }, args);
    this.dependees = this.getDependees();
    Object.keys(this.dependees || {}).forEach(function (selector) {
      _this.initializeDependee(selector, _this.dependees[selector]);
    });
  };

  states.Dependent.comparisons = {
    RegExp: function RegExp(reference, value) {
      return reference.test(value);
    },
    Function: function Function(reference, value) {
      return reference(value);
    },
    Number: function Number(reference, value) {
      return typeof value === 'string' ? _compare2(reference.toString(), value) : _compare2(reference, value);
    }
  };
  states.Dependent.prototype = {
    initializeDependee: function initializeDependee(selector, dependeeStates) {
      var _this2 = this;

      this.values[selector] = {};
      Object.keys(dependeeStates).forEach(function (i) {
        var state = dependeeStates[i];

        if ($.inArray(state, dependeeStates) === -1) {
          return;
        }

        state = states.State.sanitize(state);
        _this2.values[selector][state.name] = null;
        $(selector).on("state:".concat(state), {
          selector: selector,
          state: state
        }, function (e) {
          _this2.update(e.data.selector, e.data.state, e.value);
        });
        new states.Trigger({
          selector: selector,
          state: state
        });
      });
    },
    compare: function compare(reference, selector, state) {
      var value = this.values[selector][state.name];

      if (reference.constructor.name in states.Dependent.comparisons) {
        return states.Dependent.comparisons[reference.constructor.name](reference, value);
      }

      return _compare2(reference, value);
    },
    update: function update(selector, state, value) {
      if (value !== this.values[selector][state.name]) {
        this.values[selector][state.name] = value;
        this.reevaluate();
      }
    },
    reevaluate: function reevaluate() {
      var value = this.verifyConstraints(this.constraints);

      if (value !== this.oldValue) {
        this.oldValue = value;
        value = invert(value, this.state.invert);
        this.element.trigger({
          type: "state:".concat(this.state),
          value: value,
          trigger: true
        });
      }
    },
    verifyConstraints: function verifyConstraints(constraints, selector) {
      var result;

      if ($.isArray(constraints)) {
        var hasXor = $.inArray('xor', constraints) === -1;
        var len = constraints.length;

        for (var i = 0; i < len; i++) {
          if (constraints[i] !== 'xor') {
            var constraint = this.checkConstraints(constraints[i], selector, i);

            if (constraint && (hasXor || result)) {
              return hasXor;
            }

            result = result || constraint;
          }
        }
      } else if ($.isPlainObject(constraints)) {
        for (var n in constraints) {
          if (constraints.hasOwnProperty(n)) {
            result = ternary(result, this.checkConstraints(constraints[n], selector, n));

            if (result === false) {
              return false;
            }
          }
        }
      }

      return result;
    },
    checkConstraints: function checkConstraints(value, selector, state) {
      if (typeof state !== 'string' || /[0-9]/.test(state[0])) {
        state = null;
      } else if (typeof selector === 'undefined') {
        selector = state;
        state = null;
      }

      if (state !== null) {
        state = states.State.sanitize(state);
        return invert(this.compare(value, selector, state), state.invert);
      }

      return this.verifyConstraints(value, selector);
    },
    getDependees: function getDependees() {
      var cache = {};
      var _compare = this.compare;

      this.compare = function (reference, selector, state) {
        (cache[selector] || (cache[selector] = [])).push(state.name);
      };

      this.verifyConstraints(this.constraints);
      this.compare = _compare;
      return cache;
    }
  };

  states.Trigger = function (args) {
    $.extend(this, args);

    if (this.state in states.Trigger.states) {
      this.element = $(this.selector);

      if (!this.element.data("trigger:".concat(this.state))) {
        this.initialize();
      }
    }
  };

  states.Trigger.prototype = {
    initialize: function initialize() {
      var _this3 = this;

      var trigger = states.Trigger.states[this.state];

      if (typeof trigger === 'function') {
        trigger.call(window, this.element);
      } else {
        Object.keys(trigger || {}).forEach(function (event) {
          _this3.defaultTrigger(event, trigger[event]);
        });
      }

      this.element.data("trigger:".concat(this.state), true);
    },
    defaultTrigger: function defaultTrigger(event, valueFn) {
      var oldValue = valueFn.call(this.element);
      this.element.on(event, $.proxy(function (e) {
        var value = valueFn.call(this.element, e);

        if (oldValue !== value) {
          this.element.trigger({
            type: "state:".concat(this.state),
            value: value,
            oldValue: oldValue
          });
          oldValue = value;
        }
      }, this));
      states.postponed.push($.proxy(function () {
        this.element.trigger({
          type: "state:".concat(this.state),
          value: oldValue,
          oldValue: null
        });
      }, this));
    }
  };
  states.Trigger.states = {
    empty: {
      keyup: function keyup() {
        return this.val() === '';
      }
    },
    checked: {
      change: function change() {
        var checked = false;
        this.each(function () {
          checked = $(this).prop('checked');
          return !checked;
        });
        return checked;
      }
    },
    value: {
      keyup: function keyup() {
        if (this.length > 1) {
          return this.filter(':checked').val() || false;
        }

        return this.val();
      },
      change: function change() {
        if (this.length > 1) {
          return this.filter(':checked').val() || false;
        }

        return this.val();
      }
    },
    collapsed: {
      collapsed: function collapsed(e) {
        return typeof e !== 'undefined' && 'value' in e ? e.value : !this.is('[open]');
      }
    }
  };

  states.State = function (state) {
    this.pristine = state;
    this.name = state;
    var process = true;

    do {
      while (this.name.charAt(0) === '!') {
        this.name = this.name.substring(1);
        this.invert = !this.invert;
      }

      if (this.name in states.State.aliases) {
        this.name = states.State.aliases[this.name];
      } else {
        process = false;
      }
    } while (process);
  };

  states.State.sanitize = function (state) {
    if (state instanceof states.State) {
      return state;
    }

    return new states.State(state);
  };

  states.State.aliases = {
    enabled: '!disabled',
    invisible: '!visible',
    invalid: '!valid',
    untouched: '!touched',
    optional: '!required',
    filled: '!empty',
    unchecked: '!checked',
    irrelevant: '!relevant',
    expanded: '!collapsed',
    open: '!collapsed',
    closed: 'collapsed',
    readwrite: '!readonly'
  };
  states.State.prototype = {
    invert: false,
    toString: function toString() {
      return this.name;
    }
  };
  var $document = $(document);
  $document.on('state:disabled', function (e) {
    if (e.trigger) {
      $(e.target).prop('disabled', e.value).closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggleClass('form-disabled', e.value).find('select, input, textarea').prop('disabled', e.value);
    }
  });
  $document.on('state:required', function (e) {
    if (e.trigger) {
      if (e.value) {
        var label = "label".concat(e.target.id ? "[for=".concat(e.target.id, "]") : '');
        var $label = $(e.target).attr({
          required: 'required',
          'aria-required': 'true'
        }).closest('.js-form-item, .js-form-wrapper').find(label);

        if (!$label.hasClass('js-form-required').length) {
          $label.addClass('js-form-required form-required');
        }
      } else {
        $(e.target).removeAttr('required aria-required').closest('.js-form-item, .js-form-wrapper').find('label.js-form-required').removeClass('js-form-required form-required');
      }
    }
  });
  $document.on('state:visible', function (e) {
    if (e.trigger) {
      $(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggle(e.value);
    }
  });
  $document.on('state:checked', function (e) {
    if (e.trigger) {
      $(e.target).prop('checked', e.value);
    }
  });
  $document.on('state:collapsed', function (e) {
    if (e.trigger) {
      if ($(e.target).is('[open]') === e.value) {
        $(e.target).find('> summary').trigger('click');
      }
    }
  });
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, debounce) {
  var offsets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  function getRawOffset(el, edge) {
    var $el = $(el);
    var documentElement = document.documentElement;
    var displacement = 0;
    var horizontal = edge === 'left' || edge === 'right';
    var placement = $el.offset()[horizontal ? 'left' : 'top'];
    placement -= window["scroll".concat(horizontal ? 'X' : 'Y')] || document.documentElement["scroll".concat(horizontal ? 'Left' : 'Top')] || 0;

    switch (edge) {
      case 'top':
        displacement = placement + $el.outerHeight();
        break;

      case 'left':
        displacement = placement + $el.outerWidth();
        break;

      case 'bottom':
        displacement = documentElement.clientHeight - placement;
        break;

      case 'right':
        displacement = documentElement.clientWidth - placement;
        break;

      default:
        displacement = 0;
    }

    return displacement;
  }

  function calculateOffset(edge) {
    var edgeOffset = 0;
    var displacingElements = document.querySelectorAll("[data-offset-".concat(edge, "]"));
    var n = displacingElements.length;

    for (var i = 0; i < n; i++) {
      var el = displacingElements[i];

      if (el.style.display === 'none') {
        continue;
      }

      var displacement = parseInt(el.getAttribute("data-offset-".concat(edge)), 10);

      if (isNaN(displacement)) {
        displacement = getRawOffset(el, edge);
      }

      edgeOffset = Math.max(edgeOffset, displacement);
    }

    return edgeOffset;
  }

  function calculateOffsets() {
    return {
      top: calculateOffset('top'),
      right: calculateOffset('right'),
      bottom: calculateOffset('bottom'),
      left: calculateOffset('left')
    };
  }

  function displace(broadcast) {
    offsets = calculateOffsets();
    Drupal.displace.offsets = offsets;

    if (typeof broadcast === 'undefined' || broadcast) {
      $(document).trigger('drupalViewportOffsetChange', offsets);
    }

    return offsets;
  }

  Drupal.behaviors.drupalDisplace = {
    attach: function attach() {
      if (this.displaceProcessed) {
        return;
      }

      this.displaceProcessed = true;
      $(window).on('resize.drupalDisplace', debounce(displace, 200));
    }
  };
  Drupal.displace = displace;
  $.extend(Drupal.displace, {
    offsets: offsets,
    calculateOffset: calculateOffset
  });
})(jQuery, Drupal, Drupal.debounce);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings) {
  drupalSettings.dialog = {
    autoOpen: true,
    dialogClass: '',
    buttonClass: 'button',
    buttonPrimaryClass: 'button--primary',
    close: function close(event) {
      Drupal.dialog(event.target).close();
      Drupal.detachBehaviors(event.target, null, 'unload');
    }
  };

  Drupal.dialog = function (element, options) {
    var undef;
    var $element = $(element);
    var dialog = {
      open: false,
      returnValue: undef
    };

    function openDialog(settings) {
      settings = $.extend({}, drupalSettings.dialog, options, settings);
      $(window).trigger('dialog:beforecreate', [dialog, $element, settings]);
      $element.dialog(settings);
      dialog.open = true;
      $(window).trigger('dialog:aftercreate', [dialog, $element, settings]);
    }

    function closeDialog(value) {
      $(window).trigger('dialog:beforeclose', [dialog, $element]);
      $element.dialog('close');
      dialog.returnValue = value;
      dialog.open = false;
      $(window).trigger('dialog:afterclose', [dialog, $element]);
    }

    dialog.show = function () {
      openDialog({
        modal: false
      });
    };

    dialog.showModal = function () {
      openDialog({
        modal: true
      });
    };

    dialog.close = closeDialog;
    return dialog;
  };
})(jQuery, Drupal, drupalSettings);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings, debounce, displace) {
  drupalSettings.dialog = $.extend({
    autoResize: true,
    maxHeight: '95%'
  }, drupalSettings.dialog);

  function resetPosition(options) {
    var offsets = displace.offsets;
    var left = offsets.left - offsets.right;
    var top = offsets.top - offsets.bottom;
    var leftString = "".concat((left > 0 ? '+' : '-') + Math.abs(Math.round(left / 2)), "px");
    var topString = "".concat((top > 0 ? '+' : '-') + Math.abs(Math.round(top / 2)), "px");
    options.position = {
      my: "center".concat(left !== 0 ? leftString : '', " center").concat(top !== 0 ? topString : ''),
      of: window
    };
    return options;
  }

  function resetSize(event) {
    var positionOptions = ['width', 'height', 'minWidth', 'minHeight', 'maxHeight', 'maxWidth', 'position'];
    var adjustedOptions = {};
    var windowHeight = $(window).height();
    var option;
    var optionValue;
    var adjustedValue;

    for (var n = 0; n < positionOptions.length; n++) {
      option = positionOptions[n];
      optionValue = event.data.settings[option];

      if (optionValue) {
        if (typeof optionValue === 'string' && /%$/.test(optionValue) && /height/i.test(option)) {
          windowHeight -= displace.offsets.top + displace.offsets.bottom;
          adjustedValue = parseInt(0.01 * parseInt(optionValue, 10) * windowHeight, 10);

          if (option === 'height' && event.data.$element.parent().outerHeight() < adjustedValue) {
            adjustedValue = 'auto';
          }

          adjustedOptions[option] = adjustedValue;
        }
      }
    }

    if (!event.data.settings.modal) {
      adjustedOptions = resetPosition(adjustedOptions);
    }

    event.data.$element.dialog('option', adjustedOptions).trigger('dialogContentResize');
  }

  $(window).on({
    'dialog:aftercreate': function dialogAftercreate(event, dialog, $element, settings) {
      var autoResize = debounce(resetSize, 20);
      var eventData = {
        settings: settings,
        $element: $element
      };

      if (settings.autoResize === true || settings.autoResize === 'true') {
        $element.dialog('option', {
          resizable: false,
          draggable: false
        }).dialog('widget').css('position', 'fixed');
        $(window).on('resize.dialogResize scroll.dialogResize', eventData, autoResize).trigger('resize.dialogResize');
        $(document).on('drupalViewportOffsetChange.dialogResize', eventData, autoResize);
      }
    },
    'dialog:beforeclose': function dialogBeforeclose(event, dialog, $element) {
      $(window).off('.dialogResize');
      $(document).off('.dialogResize');
    }
  });
})(jQuery, Drupal, drupalSettings, Drupal.debounce, Drupal.displace);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, _ref) {
  var tabbable = _ref.tabbable,
      isTabbable = _ref.isTabbable;
  $.widget('ui.dialog', $.ui.dialog, {
    options: {
      buttonClass: 'button',
      buttonPrimaryClass: 'button--primary'
    },
    _createButtons: function _createButtons() {
      var opts = this.options;
      var primaryIndex;
      var index;
      var il = opts.buttons.length;

      for (index = 0; index < il; index++) {
        if (opts.buttons[index].primary && opts.buttons[index].primary === true) {
          primaryIndex = index;
          delete opts.buttons[index].primary;
          break;
        }
      }

      this._super();

      var $buttons = this.uiButtonSet.children().addClass(opts.buttonClass);

      if (typeof primaryIndex !== 'undefined') {
        $buttons.eq(index).addClass(opts.buttonPrimaryClass);
      }
    },
    _focusTabbable: function _focusTabbable() {
      var hasFocus = this._focusedElement ? this._focusedElement.get(0) : null;

      if (!hasFocus) {
        hasFocus = this.element.find('[autofocus]').get(0);
      }

      if (!hasFocus) {
        var $elements = [this.element, this.uiDialogButtonPane];

        for (var i = 0; i < $elements.length; i++) {
          var element = $elements[i].get(0);

          if (element) {
            var elementTabbable = tabbable(element);
            hasFocus = elementTabbable.length ? elementTabbable[0] : null;
          }

          if (hasFocus) {
            break;
          }
        }
      }

      if (!hasFocus) {
        var closeBtn = this.uiDialogTitlebarClose.get(0);
        hasFocus = closeBtn && isTabbable(closeBtn) ? closeBtn : null;
      }

      if (!hasFocus) {
        hasFocus = this.uiDialog.get(0);
      }

      $(hasFocus).eq(0).trigger('focus');
    }
  });
})(jQuery, window.tabbable);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.dialog = {
    attach: function attach(context, settings) {
      var $context = $(context);

      if (!$('#drupal-modal').length) {
        $('<div id="drupal-modal" class="ui-front"></div>').hide().appendTo('body');
      }

      var $dialog = $context.closest('.ui-dialog-content');

      if ($dialog.length) {
        if ($dialog.dialog('option', 'drupalAutoButtons')) {
          $dialog.trigger('dialogButtonsChange');
        }

        $dialog.dialog('widget').trigger('focus');
      }

      var originalClose = settings.dialog.close;

      settings.dialog.close = function (event) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        originalClose.apply(settings.dialog, [event].concat(args));
        $(event.target).remove();
      };
    },
    prepareDialogButtons: function prepareDialogButtons($dialog) {
      var buttons = [];
      var $buttons = $dialog.find('.form-actions input[type=submit], .form-actions a.button');
      $buttons.each(function () {
        var $originalButton = $(this).css({
          display: 'none'
        });
        buttons.push({
          text: $originalButton.html() || $originalButton.attr('value'),
          class: $originalButton.attr('class'),
          click: function click(e) {
            if ($originalButton.is('a')) {
              $originalButton[0].click();
            } else {
              $originalButton.trigger('mousedown').trigger('mouseup').trigger('click');
              e.preventDefault();
            }
          }
        });
      });
      return buttons;
    }
  };

  Drupal.AjaxCommands.prototype.openDialog = function (ajax, response, status) {
    if (!response.selector) {
      return false;
    }

    var $dialog = $(response.selector);

    if (!$dialog.length) {
      $dialog = $("<div id=\"".concat(response.selector.replace(/^#/, ''), "\" class=\"ui-front\"></div>")).appendTo('body');
    }

    if (!ajax.wrapper) {
      ajax.wrapper = $dialog.attr('id');
    }

    response.command = 'insert';
    response.method = 'html';
    ajax.commands.insert(ajax, response, status);

    if (!response.dialogOptions.buttons) {
      response.dialogOptions.drupalAutoButtons = true;
      response.dialogOptions.buttons = Drupal.behaviors.dialog.prepareDialogButtons($dialog);
    }

    $dialog.on('dialogButtonsChange', function () {
      var buttons = Drupal.behaviors.dialog.prepareDialogButtons($dialog);
      $dialog.dialog('option', 'buttons', buttons);
    });
    response.dialogOptions = response.dialogOptions || {};
    var dialog = Drupal.dialog($dialog.get(0), response.dialogOptions);

    if (response.dialogOptions.modal) {
      dialog.showModal();
    } else {
      dialog.show();
    }

    $dialog.parent().find('.ui-dialog-buttonset').addClass('form-actions');
  };

  Drupal.AjaxCommands.prototype.closeDialog = function (ajax, response, status) {
    var $dialog = $(response.selector);

    if ($dialog.length) {
      Drupal.dialog($dialog.get(0)).close();

      if (!response.persist) {
        $dialog.remove();
      }
    }

    $dialog.off('dialogButtonsChange');
  };

  Drupal.AjaxCommands.prototype.setDialogOption = function (ajax, response, status) {
    var $dialog = $(response.selector);

    if ($dialog.length) {
      $dialog.dialog('option', response.optionName, response.optionValue);
    }
  };

  $(window).on('dialog:aftercreate', function (e, dialog, $element, settings) {
    $element.on('click.dialog', '.dialog-cancel', function (e) {
      dialog.close('cancel');
      e.preventDefault();
      e.stopPropagation();
    });
  });
  $(window).on('dialog:beforeclose', function (e, dialog, $element) {
    $element.off('.dialog');
  });
})(jQuery, Drupal);;

(function ($, Drupal, drupalSettings) {

  'use strict';

  Drupal.behaviors.tokenTree = {
    attach: function (context, settings) {
      $('table.token-tree', context).once('token-tree').each(function () {
        $(this).treetable({ expandable: true });
      });
    }
  };

  Drupal.behaviors.tokenInsert = {
    attach: function (context, settings) {
      // Keep track of which textfield was last selected/focused.
      $('textarea, input[type="text"]', context).focus(function () {
        drupalSettings.tokenFocusedField = this;
      });

      $('.token-click-insert .token-key', context).once('token-click-insert').each(function () {
        var newThis = $('<a href="javascript:void(0);" title="' + Drupal.t('Insert this token into your form') + '">' + $(this).html() + '</a>').click(function () {
          var content = this.text;

          // Always work in normal text areas that currently have focus.
          if (drupalSettings.tokenFocusedField && (drupalSettings.tokenFocusedField.tokenDialogFocus || drupalSettings.tokenFocusedField.tokenHasFocus)) {
            insertAtCursor(drupalSettings.tokenFocusedField, content);
          }
          // Direct tinyMCE support.
          else if (typeof(tinyMCE) != 'undefined' && tinyMCE.activeEditor) {
            tinyMCE.activeEditor.execCommand('mceInsertContent', false, content);
          }
          // Direct CKEditor support. Only works if the field currently has focus,
          // which is unusual since the dialog is open.
          else if (typeof(CKEDITOR) != 'undefined' && CKEDITOR.currentInstance) {
            CKEDITOR.currentInstance.insertHtml(content);
          }
          // Direct CodeMirror support.
          else if (typeof(CodeMirror) != 'undefined' && drupalSettings.tokenFocusedField && $(drupalSettings.tokenFocusedField).parents('.CodeMirror').length) {
            var editor = $(drupalSettings.tokenFocusedField).parents('.CodeMirror')[0].CodeMirror;
            editor.replaceSelection(content);
            editor.focus();
          }
          // WYSIWYG support, should work in all editors if available.
          else if (Drupal.wysiwyg && Drupal.wysiwyg.activeId) {
            Drupal.wysiwyg.instances[Drupal.wysiwyg.activeId].insert(content)
          }
          // CKeditor module support.
          else if (typeof(CKEDITOR) != 'undefined' && typeof(Drupal.ckeditorActiveId) != 'undefined') {
            CKEDITOR.instances[Drupal.ckeditorActiveId].insertHtml(content);
          }
          else if (drupalSettings.tokenFocusedField) {
            insertAtCursor(drupalSettings.tokenFocusedField, content);
          }
          else {
            alert(Drupal.t('First click a text field to insert your tokens into.'));
          }

          return false;
        });
        $(this).html(newThis);
      });

      function insertAtCursor(editor, content) {
        // Record the current scroll position.
        var scroll = editor.scrollTop;

        // IE support.
        if (document.selection) {
          editor.focus();
          var sel = document.selection.createRange();
          sel.text = content;
        }

        // Mozilla/Firefox/Netscape 7+ support.
        else if (editor.selectionStart || editor.selectionStart == '0') {
          var startPos = editor.selectionStart;
          var endPos = editor.selectionEnd;
          editor.value = editor.value.substring(0, startPos) + content + editor.value.substring(endPos, editor.value.length);
        }

        // Fallback, just add to the end of the content.
        else {
          editor.value += content;
        }

        // Ensure the textarea does not unexpectedly scroll.
        editor.scrollTop = scroll;
      }
    }
  };

})(jQuery, Drupal, drupalSettings);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.menuUiDetailsSummaries = {
    attach: function attach(context) {
      $(context).find('.menu-link-form').drupalSetSummary(function (context) {
        var $context = $(context);

        if ($context.find('.js-form-item-menu-enabled input').is(':checked')) {
          return Drupal.checkPlain($context.find('.js-form-item-menu-title input').val());
        }

        return Drupal.t('Not in menu');
      });
    }
  };
  Drupal.behaviors.menuUiLinkAutomaticTitle = {
    attach: function attach(context) {
      var $context = $(context);
      $context.find('.menu-link-form').each(function () {
        var $this = $(this);
        var $checkbox = $this.find('.js-form-item-menu-enabled input');
        var $linkTitle = $context.find('.js-form-item-menu-title input');
        var $title = $this.closest('form').find('.js-form-item-title-0-value input');

        if (!($checkbox.length && $linkTitle.length && $title.length)) {
          return;
        }

        if ($checkbox.is(':checked') && $linkTitle.val().length) {
          $linkTitle.data('menuLinkAutomaticTitleOverridden', true);
        }

        $linkTitle.on('keyup', function () {
          $linkTitle.data('menuLinkAutomaticTitleOverridden', true);
        });
        $checkbox.on('change', function () {
          if ($checkbox.is(':checked')) {
            if (!$linkTitle.data('menuLinkAutomaticTitleOverridden')) {
              $linkTitle.val($title.val());
            }
          } else {
            $linkTitle.val('');
            $linkTitle.removeData('menuLinkAutomaticTitleOverridden');
          }

          $checkbox.closest('.vertical-tabs-pane').trigger('summaryUpdated');
          $checkbox.trigger('formUpdated');
        });
        $title.on('keyup', function () {
          if (!$linkTitle.data('menuLinkAutomaticTitleOverridden') && $checkbox.is(':checked')) {
            $linkTitle.val($title.val());
            $linkTitle.val($title.val()).trigger('formUpdated');
          }
        });
      });
    }
  };
})(jQuery, Drupal);;
!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){function d(){var a=document.getElementById(this.config.targets.snippet);return new g({analyzerApp:this,targetElement:a,callbacks:{saveSnippetData:this.config.callbacks.saveSnippetData}})}function e(a){return!l(a)&&g.prototype.isPrototypeOf(a)}function f(a){if(!i(a.callbacks.getData))throw new k("The app requires an object with a getdata callback.");if(!i(a.targets))throw new k("`targets` is a required App argument, `targets` is not an object.");if(!j(a.targets.output))throw new k("`targets.output` is a required App argument, `targets.output` is not a string.");if(!e(a.snippetPreview)&&!j(a.targets.snippet))throw new k("A snippet preview is required. When no SnippetPreview object isn't passed to the App, the `targets.snippet` is a required App argument. `targets.snippet` is not a string.")}a("./config/config.js");var g=a("./snippetPreview.js"),h=a("lodash/defaultsDeep"),i=a("lodash/isObject"),j=a("lodash/isString"),k=a("./errors/missingArgument"),l=a("lodash/isUndefined"),m=a("lodash/forEach"),n=a("jed"),o=a("./seoAssessor.js"),p=a("./researcher.js"),q=a("./renderers/AssessorPresenter.js"),r=a("./pluggable.js"),s=a("./values/Paper.js"),t={callbacks:{bindElementEvents:function(){},updateSnippetValues:function(){},saveScores:function(){}},sampleText:{baseUrl:"example.org/",snippetCite:"example-post/",title:"This is an example title - edit by clicking here",keyword:"Choose a focus keyword",meta:"Modify your meta description by editing it right here",text:"Start writing your text!"},queue:["wordCount","keywordDensity","subHeadings","stopwords","fleschReading","linkCount","imageCount","urlKeyword","urlLength","metaDescription","pageTitleKeyword","pageTitleLength","firstParagraph","'keywordDoubles"],typeDelay:300,typeDelayStep:100,maxTypeDelay:1500,dynamicDelay:!0,locale:"en_US",translations:{domain:"js-text-analysis",locale_data:{"js-text-analysis":{"":{}}}},replaceTarget:[],resetTarget:[],elementTarget:[]},u=function(a){i(a)||(a={}),h(a,t),f(a),this.config=a,this.callbacks=this.config.callbacks,this.i18n=this.constructI18n(this.config.translations),l(a.assessor)?this.assessor=new o(this.i18n):this.assessor=a.assessor,this.pluggable=new r(this),this.getData(),this.showLoadingDialog(),e(a.snippetPreview)?(this.snippetPreview=a.snippetPreview,this.snippetPreview.refObj!==this&&(this.snippetPreview.refObj=this,this.snippetPreview.i18n=this.i18n)):this.snippetPreview=d.call(this),this.initSnippetPreview(),this.runAnalyzer()};u.prototype.extendConfig=function(a){return a.sampleText=this.extendSampleText(a.sampleText),a.locale=a.locale||"en_US",a},u.prototype.extendSampleText=function(a){var b=t.sampleText;if(l(a))a=b;else for(var c in a)l(a[c])&&(a[c]=b[c]);return a},u.prototype.constructI18n=function(a){var b={domain:"js-text-analysis",locale_data:{"js-text-analysis":{"":{}}}};return a=a||b,new n(a)},u.prototype.getData=function(){if(this.rawData=this.callbacks.getData(),!l(this.snippetPreview)){var a=this.snippetPreview.getAnalyzerData();this.rawData.pageTitle=a.title,this.rawData.url=a.url,this.rawData.meta=a.metaDesc}this.pluggable.loaded&&(this.rawData.pageTitle=this.pluggable._applyModifications("data_page_title",this.rawData.pageTitle),this.rawData.meta=this.pluggable._applyModifications("data_meta_desc",this.rawData.meta)),this.rawData.locale=this.config.locale},u.prototype.refresh=function(){this.getData(),this.runAnalyzer()},u.prototype.createSnippetPreview=function(){this.snippetPreview=d.call(this),this.initSnippetPreview()},u.prototype.initSnippetPreview=function(){this.snippetPreview.renderTemplate(),this.snippetPreview.callRegisteredEventBinder(),this.snippetPreview.bindEvents(),this.snippetPreview.init()},u.prototype.bindInputEvent=function(){for(var a=0;a<this.config.elementTarget.length;a++){var b=document.getElementById(this.config.elementTarget[a]);b.addEventListener("input",this.analyzeTimer.bind(this))}},u.prototype.reloadSnippetText=function(){l(this.snippetPreview)&&this.snippetPreview.reRender()},u.prototype.analyzeTimer=function(){clearTimeout(window.timer),window.timer=setTimeout(this.refresh.bind(this),this.config.typeDelay)},u.prototype.startTime=function(){this.startTimestamp=(new Date).getTime()},u.prototype.endTime=function(){this.endTimestamp=(new Date).getTime(),this.endTimestamp-this.startTimestamp>this.config.typeDelay&&this.config.typeDelay<this.config.maxTypeDelay-this.config.typeDelayStep&&(this.config.typeDelay+=this.config.typeDelayStep)},u.prototype.runAnalyzer=function(){this.pluggable.loaded!==!1&&(this.config.dynamicDelay&&this.startTime(),this.analyzerData=this.modifyData(this.rawData),this.paper=new s(this.analyzerData.text,{keyword:this.analyzerData.keyword,description:this.analyzerData.meta,url:this.analyzerData.url,title:this.analyzerData.pageTitle,locale:this.config.locale}),l(this.researcher)?this.researcher=new p(this.paper):this.researcher.setPaper(this.paper),this.assessor.assess(this.paper),this.assessorPresenter=new q({targets:this.config.targets,keyword:this.paper.getKeyword(),assessor:this.assessor,i18n:this.i18n}),this.assessorPresenter.render(),this.callbacks.saveScores(this.assessor.calculateOverallScore(),this.assessorPresenter),this.config.dynamicDelay&&this.endTime(),this.snippetPreview.reRender())},u.prototype.modifyData=function(a){return a=JSON.parse(JSON.stringify(a)),a.text=this.pluggable._applyModifications("content",a.text),a.title=this.pluggable._applyModifications("title",a.title),a},u.prototype.pluginsLoaded=function(){this.getData(),this.removeLoadingDialog(),this.runAnalyzer()},u.prototype.showLoadingDialog=function(){var a=document.createElement("div");a.className="YoastSEO_msg",a.id="YoastSEO-plugin-loading",document.getElementById(this.config.targets.output).appendChild(a)},u.prototype.updateLoadingDialog=function(a){var b=document.getElementById("YoastSEO-plugin-loading");b.textContent="",m(a,function(a,c){b.innerHTML+="<span class=left>"+c+"</span><span class=right "+a.status+">"+a.status+"</span><br />"}),b.innerHTML+="<span class=bufferbar></span>"},u.prototype.removeLoadingDialog=function(){document.getElementById(this.config.targets.output).removeChild(document.getElementById("YoastSEO-plugin-loading"))},u.prototype.registerPlugin=function(a,b){return this.pluggable._registerPlugin(a,b)},u.prototype.pluginReady=function(a){return this.pluggable._ready(a)},u.prototype.pluginReloaded=function(a){return this.pluggable._reloaded(a)},u.prototype.registerModification=function(a,b,c,d){return this.pluggable._registerModification(a,b,c,d)},u.prototype.registerTest=function(){console.error("This function is deprecated, please use registerAssessment")},u.prototype.registerAssessment=function(a,b,c){return this.pluggable._registerAssessment(this.assessor,a,b,c)},b.exports=u},{"./config/config.js":22,"./errors/missingArgument":29,"./pluggable.js":31,"./renderers/AssessorPresenter.js":32,"./researcher.js":33,"./seoAssessor.js":54,"./snippetPreview.js":55,"./values/Paper.js":82,jed:87,"lodash/defaultsDeep":227,"lodash/forEach":230,"lodash/isObject":245,"lodash/isString":248,"lodash/isUndefined":251}],2:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=a("lodash/inRange"),f=function(a,b){return a>90?{score:9,resultText:b.dgettext("js-text-analysis","very easy"),note:""}:e(a,80,90)?{score:9,resultText:b.dgettext("js-text-analysis","easy"),note:""}:e(a,70,80)?{score:8,resultText:b.dgettext("js-text-analysis","fairly easy"),note:""}:e(a,60,70)?{score:8,resultText:b.dgettext("js-text-analysis","ok"),note:""}:e(a,50,60)?{score:6,resultText:b.dgettext("js-text-analysis","fairly difficult"),note:b.dgettext("js-text-analysis","Try to make shorter sentences to improve readability.")}:e(a,30,50)?{score:5,resultText:b.dgettext("js-text-analysis","difficult"),note:b.dgettext("js-text-analysis","Try to make shorter sentences, using less difficult words to improve readability.")}:30>a?{score:4,resultText:b.dgettext("js-text-analysis","very difficult"),note:b.dgettext("js-text-analysis","Try to make shorter sentences, using less difficult words to improve readability.")}:void 0},g=function(a,b,c){var e=b.getResearch("calculateFleschReading"),g=c.dgettext("js-text-analysis","The copy scores %1$s in the %2$s test, which is considered %3$s to read. %4$s"),h="<a href='https://yoast.com/flesch-reading-ease-score/' target='new'>Flesch Reading Ease</a>";0>e&&(e=0),e>100&&(e=100);var i=f(e,c);g=c.sprintf(g,e,h,i.resultText,i.note);var j=new d;return j.setScore(i.score),j.setText(g),j};b.exports={getResult:g,isApplicable:function(a){return a.getLocale().indexOf("en_")>-1}}},{"../values/AssessmentResult.js":81,"lodash/inRange":234}],3:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){return a>0?{score:9,text:b.dgettext("js-text-analysis","The focus keyword appears in the first paragraph of the copy.")}:{score:3,text:b.dgettext("js-text-analysis","The focus keyword doesn't appear in the first paragraph of the copy. Make sure the topic is clear immediately.")}},f=function(a,b,c){var f=b.getResearch("firstParagraph"),g=e(f,c),h=new d;return h.setScore(g.score),h.setText(g.text),h};b.exports={getResult:f,isApplicable:function(a){return a.hasKeyword()}}},{"../values/AssessmentResult.js":81}],4:[function(a,b,c){function d(a,b,c){var d=b.getResearch("keyphraseLength"),f=new e;return a.hasKeyword()?d>10&&(f.setScore(0),f.setText(c.dgettext("js-text-analysis","Your keyphrase is over 10 words, a keyphrase should be shorter."))):(f.setScore(-999),f.setText(c.dgettext("js-text-analysis","No focus keyword was set for this page. If you do not set a focus keyword, no score can be calculated."))),f}var e=a("../values/AssessmentResult.js");b.exports={getResult:d}},{"../values/AssessmentResult.js":81}],5:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=a("../stringProcessing/matchTextWithWord.js"),f=a("../stringProcessing/countWords.js"),g=a("lodash/inRange"),h=function(a,b,c){var d,e,f,h=a.toFixed(1)+"%";return a>3.5&&(d=-50,e=b.dgettext("js-text-analysis","The keyword density is %1$s, which is way over the advised %3$s maximum; the focus keyword was found %2$d times."),f=b.dgettext("js-text-analysis","2.5")+"%",e=b.sprintf(e,h,c,f)),g(a,2.5,3.5)&&(d=-10,e=b.dgettext("js-text-analysis","The keyword density is %1$s, which is over the advised %3$s maximum; the focus keyword was found %2$d times."),f=b.dgettext("js-text-analysis","2.5")+"%",e=b.sprintf(e,h,c,f)),g(a,.5,2.5)&&(d=9,e=b.dgettext("js-text-analysis","The keyword density is %1$s, which is great; the focus keyword was found %2$d times."),e=b.sprintf(e,h,c)),g(a,0,.5)&&(d=4,e=b.dgettext("js-text-analysis","The keyword density is %1$s, which is a bit low; the focus keyword was found %2$d times."),e=b.sprintf(e,h,c)),{score:d,text:e}},i=function(a,b,c){var f=b.getResearch("getKeywordDensity"),g=e(a.getText(),a.getKeyword()),i=h(f,c,g),j=new d;return j.setScore(i.score),j.setText(i.text),j};b.exports={getResult:i,isApplicable:function(a){return a.hasText()&&a.hasKeyword()&&f(a.getText())>=100}}},{"../stringProcessing/countWords.js":61,"../stringProcessing/matchTextWithWord.js":69,"../values/AssessmentResult.js":81,"lodash/inRange":234}],6:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){return a>0?{score:0,text:b.dngettext("js-text-analysis","Your focus keyword contains a stop word. This may or may not be wise depending on the circumstances. Read %1$sthis article%2$s for more info.","Your focus keyword contains %3$d stop words. This may or may not be wise depending on the circumstances. Read %1$sthis article%2$s for more info.",a)}:{}},f=function(a,b,c){var f=b.getResearch("stopWordsInKeyword"),g=e(f.length,c),h=new d;return h.setScore(g.score),h.setText(c.sprintf(g.text,"<a href='https://yoast.com/handling-stopwords/' target='new'>","</a>",f.length)),h};b.exports={getResult:f,isApplicable:function(a){return a.hasKeyword()}}},{"../values/AssessmentResult.js":81}],7:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){return a>0?{score:9,text:b.dgettext("js-text-analysis","The meta description contains the focus keyword.")}:0===a?{score:3,text:b.dgettext("js-text-analysis","A meta description has been specified, but it does not contain the focus keyword.")}:{}},f=function(a,b,c){var f=b.getResearch("metaDescriptionKeyword"),g=e(f,c),h=new d;return h.setScore(g.score),h.setText(g.text),h};b.exports={getResult:f,isApplicable:function(a){return a.hasKeyword()}}},{"../values/AssessmentResult.js":81}],8:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){var c=120,d=156;return 0===a?{score:1,text:b.dgettext("js-text-analysis","No meta description has been specified, search engines will display copy from the page instead.")}:c>=a?{score:6,text:b.sprintf(b.dgettext("js-text-analysis","The meta description is under %1$d characters, however up to %2$d characters are available."),c,d)}:a>d?{score:6,text:b.sprintf(b.dgettext("js-text-analysis","The specified meta description is over %1$d characters. Reducing it will ensure the entire description is visible."),d)}:a>=c&&d>=a?{score:9,text:b.dgettext("js-text-analysis","In the specified meta description, consider: How does it compare to the competition? Could it be made more appealing?")}:void 0},f=function(a,b,c){var f=b.getResearch("metaDescriptionLength"),g=e(f,c),h=new d;return h.setScore(g.score),h.setText(g.text),h};b.exports={getResult:f}},{"../values/AssessmentResult.js":81}],9:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){return 0===a.matches?{score:3,text:b.dgettext("js-text-analysis","You have not used your focus keyword in any subheading (such as an H2) in your copy.")}:a.matches>=1?{score:9,text:b.sprintf(b.dgettext("js-text-analysis","The focus keyword appears in %2$d (out of %1$d) subheadings in the copy. While not a major ranking factor, this is beneficial."),a.count,a.matches)}:{}},f=function(a,b,c){var f=b.getResearch("matchKeywordInSubheadings"),g=e(f,c),h=new d;return h.setScore(g.score),h.setText(g.text),h};b.exports={getResult:f,isApplicable:function(a){return a.hasText()&&a.hasKeyword()}}},{"../values/AssessmentResult.js":81}],10:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){return a.totalKeyword>0?{score:2,text:b.dgettext("js-text-analysis","You're linking to another page with the focus keyword you want this page to rank for. Consider changing that if you truly want this page to rank.")}:{}},f=function(a,b,c){var f=b.getResearch("getLinkStatistics"),g=e(f,c),h=new d;return h.setScore(g.score),h.setText(g.text),h};b.exports={getResult:f,isApplicable:function(a){return a.hasText()&&a.hasKeyword()}}},{"../values/AssessmentResult.js":81}],11:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=a("lodash/isEmpty"),f=function(a,b){return 0===a?{score:3,text:b.dgettext("js-text-analysis","No images appear in this page, consider adding some as appropriate.")}:{}},g=function(a,b){return a.withAltKeyword>0?{score:9,text:b.dgettext("js-text-analysis","The images on this page contain alt attributes with the focus keyword.")}:a.withAltNonKeyword>0?{score:5,text:b.dgettext("js-text-analysis","The images on this page do not have alt attributes containing your focus keyword.")}:a.withAlt>0?{score:5,text:b.dgettext("js-text-analysis","The images on this page contain alt attributes.")}:a.noAlt>0?{score:5,text:b.dgettext("js-text-analysis","The images on this page are missing alt attributes.")}:{}},h=function(a,b,c){var h=new d,i=b.getResearch("imageCount"),j=f(i,c);if(e(j)){var k=b.getResearch("altTagCount"),l=g(k,c);return h.setScore(l.score),h.setText(l.text),h}return h.setScore(j.score),h.setText(j.text),h};b.exports={getResult:h,isApplicable:function(a){return a.hasText()}}},{"../values/AssessmentResult.js":81,"lodash/isEmpty":241}],12:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=a("lodash/inRange"),f=function(a,b){return a>300?{score:9,text:b.dngettext("js-text-analysis","The text contains %1$d word. This is more than the %2$d word recommended minimum.","The text contains %1$d words. This is more than the %2$d word recommended minimum.",a)}:e(a,250,300)?{score:7,text:b.dngettext("js-text-analysis","The text contains %1$d word. This is slightly below the %2$d word recommended minimum. Add a bit more copy.","The text contains %1$d words. This is slightly below the %2$d word recommended minimum. Add a bit more copy.",a)}:e(a,200,250)?{score:5,text:b.dngettext("js-text-analysis","The text contains %1$d word. This is below the %2$d word recommended minimum. Add more useful content on this topic for readers.","The text contains %1$d words. This is below the %2$d word recommended minimum. Add more useful content on this topic for readers.",a)}:e(a,100,200)?{score:-10,text:b.dngettext("js-text-analysis","The text contains %1$d word. This is below the %2$d word recommended minimum. Add more useful content on this topic for readers.","The text contains %1$d words. This is below the %2$d word recommended minimum. Add more useful content on this topic for readers.",a)}:e(a,0,100)?{score:-20,text:b.dngettext("js-text-analysis","The text contains %1$d word. This is far too low and should be increased.","The text contains %1$d words. This is far too low and should be increased.",a)}:void 0},g=function(a,b,c){var e=b.getResearch("wordCountInText"),g=f(e,c),h=new d;return h.setScore(g.score),h.setText(c.sprintf(g.text,e,300)),h};b.exports={getResult:g}},{"../values/AssessmentResult.js":81,"lodash/inRange":234}],13:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=a("lodash/isEmpty"),f=function(a,b){return 0===a.total?{score:6,text:b.dgettext("js-text-analysis","No links appear in this page, consider adding some as appropriate.")}:a.externalNofollow===a.total?{score:7,text:b.sprintf(b.dgettext("js-text-analysis","This page has %1$s outbound link(s), all nofollowed."),a.externalNofollow)}:a.externalNofollow<a.total?{score:8,text:b.sprintf(b.dgettext("js-text-analysis","This page has %1$s nofollowed link(s) and %2$s normal outbound link(s)."),a.externalNofollow,a.externalDofollow)}:a.externalDofollow===a.total?{score:9,text:b.sprintf(b.dgettext("js-text-analysis","This page has %1$s outbound link(s)."),a.externalTotal)}:void 0},g=function(a,b,c){var g=b.getResearch("getLinkStatistics"),h=new d;if(!e(g)){var i=f(g,c);h.setScore(i.score),h.setText(i.text)}return h};b.exports={getResult:g,isApplicable:function(a){return a.hasText()}}},{"../values/AssessmentResult.js":81,"lodash/isEmpty":241}],14:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){return 0===a.count?{score:7,text:b.dgettext("js-text-analysis","No subheading tags (like an H2) appear in the copy.")}:{}},f=function(a,b,c){var f=b.getResearch("matchKeywordInSubheadings"),g=e(f,c),h=new d;return h.setScore(g.score),h.setText(g.text),h};b.exports={getResult:f,isApplicable:function(a){return a.hasText()}}},{"../values/AssessmentResult.js":81}],15:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b,c){var e,f,g=b.getResearch("findKeywordInPageTitle");0===g.matches&&(e=2,f=c.sprintf(c.dgettext("js-text-analysis","The focus keyword '%1$s' does not appear in the page title."),a.getKeyword())),g.matches>0&&0===g.position&&(e=9,f=c.dgettext("js-text-analysis","The page title contains the focus keyword, at the beginning which is considered to improve rankings.")),g.matches>0&&g.position>0&&(e=6,f=c.dgettext("js-text-analysis","The page title contains the focus keyword, but it does not appear at the beginning; try and move it to the beginning."));var h=new d;return h.setScore(e),h.setText(f),h};b.exports={getResult:e,isApplicable:function(a){return a.hasKeyword()}}},{"../values/AssessmentResult.js":81}],16:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=a("lodash/inRange"),f=function(a,b){var c=35,d=65;return e(a,1,35)?{score:6,text:b.sprintf(b.dngettext("js-text-analysis","The page title contains %1$d character, which is less than the recommended minimum of %2$d characters. Use the space to add keyword variations or create compelling call-to-action copy.","The page title contains %1$d characters, which is less than the recommended minimum of %2$d characters. Use the space to add keyword variations or create compelling call-to-action copy.",a),a,c)}:e(a,35,66)?{score:9,text:b.sprintf(b.dgettext("js-text-analysis","The page title is between the %1$d character minimum and the recommended %2$d character maximum."),c,d)}:a>d?{score:6,text:b.sprintf(b.dngettext("js-text-analysis","The page title contains %1$d character, which is more than the viewable limit of %2$d characters; some words will not be visible to users in your listing.","The page title contains %1$d characters, which is more than the viewable limit of %2$d characters; some words will not be visible to users in your listing.",a),a,d)}:{score:1,text:b.dgettext("js-text-analysis","Please create a page title.")}},g=function(a,b,c){var e=b.getResearch("pageTitleLength"),g=f(e,c),h=new d;return h.setScore(g.score),h.setText(g.text),h};b.exports={getResult:g}},{"../values/AssessmentResult.js":81,"lodash/inRange":234}],17:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){return a>0?{score:9,text:b.dgettext("js-text-analysis","The focus keyword appears in the URL for this page.")}:{score:6,text:b.dgettext("js-text-analysis","The focus keyword does not appear in the URL for this page. If you decide to rename the URL be sure to check the old URL 301 redirects to the new one!")}},f=function(a,b,c){var f=b.getResearch("keywordCountInUrl"),g=e(f,c),h=new d;return h.setScore(g.score),h.setText(g.text),h};b.exports={getResult:f,isApplicable:function(a){return a.hasKeyword()&&a.hasUrl()}}},{"../values/AssessmentResult.js":81}],18:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b,c){var e=b.getResearch("urlLength"),f=new d;if(e){var g=5,h=c.dgettext("js-text-analysis","The slug for this page is a bit long, consider shortening it.");f.setScore(g),f.setText(h)}return f};b.exports={getResult:e,isApplicable:function(a){return a.hasUrl()}}},{"../values/AssessmentResult.js":81}],19:[function(a,b,c){var d=a("../values/AssessmentResult.js"),e=function(a,b){return a>0?{score:5,text:b.dngettext("js-text-analysis","The slug for this page contains a %1$sstop word%2$s, consider removing it.","The slug for this page contains %1$sstop words%2$s, consider removing them.",a)}:{}},f=function(a,b,c){var f=b.getResearch("stopWordsInUrl"),g=e(f.length,c),h=new d;return h.setScore(g.score),h.setText(c.sprintf(g.text,"<a href='"+c.dgettext("js-text-analysis","http://en.wikipedia.org/wiki/Stop_words")+"' target='new'>","</a>")),h};b.exports={getResult:f}},{"../values/AssessmentResult.js":81}],20:[function(a,b,c){var d=a("./researcher.js"),e=a("./errors/missingArgument"),f=a("lodash/isUndefined"),g=a("lodash/forEach"),h=9,i=function(a){this.setI18n(a),this._assessments={}};i.prototype.setI18n=function(a){if(f(a))throw new e("The assessor requires an i18n object.");this.i18n=a},i.prototype.getAvailableAssessments=function(){return this._assessments},i.prototype.isApplicable=function(a,b,c){return a.hasOwnProperty("isApplicable")?a.isApplicable(b,c):!0},i.prototype.assess=function(a){var b=new d(a),c=this.getAvailableAssessments();this.results=[],g(c,function(c,d){this.isApplicable(c,a,b)&&this.results.push({name:d,result:c.getResult(a,b,this.i18n)})}.bind(this))},i.prototype.getValidResults=function(){var a=[];return g(this.results,function(b){this.isValidResult(b.result)&&a.push(b.result)}.bind(this)),a},i.prototype.isValidResult=function(a){return a.hasScore()&&a.hasText()},i.prototype.calculateOverallScore=function(){var a=this.getValidResults(),b=0;return g(a,function(a){b+=a.getScore()}),Math.round(b/(a.length*h)*100)},i.prototype.addAssessment=function(a,b){return this._assessments[a]=b,!0},i.prototype.removeAssessment=function(a){delete this._assessments[a]},b.exports=i},{"./errors/missingArgument":29,"./researcher.js":33,"lodash/forEach":230,"lodash/isUndefined":251}],21:[function(a,b,c){YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.SnippetPreview=a("./../snippetPreview.js"),YoastSEO.Pluggable=a("./../pluggable.js"),YoastSEO.App=a("./../app.js"),YoastSEO.App.prototype._sanitizeKeyword=a("../stringProcessing/sanitizeString.js"),YoastSEO.Jed=a("jed")},{"../stringProcessing/sanitizeString.js":72,"./../app.js":1,"./../pluggable.js":31,"./../snippetPreview.js":55,jed:87}],22:[function(a,b,c){var d={queue:["wordCount","keywordDensity","subHeadings","stopwords","fleschReading","linkCount","imageCount","urlKeyword","urlLength","metaDescriptionLength","metaDescriptionKeyword","pageTitleKeyword","pageTitleLength","firstParagraph","urlStopwords","keywordDoubles","keyphraseSizeCheck"],stopWords:["a","about","above","after","again","against","all","am","an","and","any","are","as","at","be","because","been","before","being","below","between","both","but","by","could","did","do","does","doing","down","during","each","few","for","from","further","had","has","have","having","he","he'd","he'll","he's","her","here","here's","hers","herself","him","himself","his","how","how's","i","i'd","i'll","i'm","i've","if","in","into","is","it","it's","its","itself","let's","me","more","most","my","myself","nor","of","on","once","only","or","other","ought","our","ours","ourselves","out","over","own","same","she","she'd","she'll","she's","should","so","some","such","than","that","that's","the","their","theirs","them","themselves","then","there","there's","these","they","they'd","they'll","they're","they've","this","those","through","to","too","under","until","up","very","was","we","we'd","we'll","we're","we've","were","what","what's","when","when's","where","where's","which","while","who","who's","whom","why","why's","with","would","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves"],wordsToRemove:[" a"," in"," an"," on"," for"," the"," and"],maxSlugLength:20,maxUrlLength:40,maxMeta:156};b.exports=d},{}],23:[function(a,b,c){b.exports=function(){return[{base:"a",letters:/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},{base:"aa",letters:/[\uA733]/g},{base:"ae",letters:/[\u00E6\u01FD\u01E3]/g},{base:"ao",letters:/[\uA735]/g},{base:"au",letters:/[\uA737]/g},{base:"av",letters:/[\uA739\uA73B]/g},{base:"ay",letters:/[\uA73D]/g},{base:"b",letters:/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},{base:"c",letters:/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},{base:"d",letters:/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},{base:"dz",letters:/[\u01F3\u01C6]/g},{base:"e",letters:/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},{base:"f",letters:/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},{base:"g",letters:/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},{base:"h",letters:/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},{base:"hv",letters:/[\u0195]/g},{base:"i",letters:/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},{base:"j",letters:/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},{base:"k",letters:/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},{base:"l",letters:/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},{base:"lj",letters:/[\u01C9]/g},{base:"m",letters:/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},{base:"n",letters:/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},{base:"nj",letters:/[\u01CC]/g},{base:"o",letters:/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},{base:"oi",letters:/[\u01A3]/g},{base:"ou",letters:/[\u0223]/g},{base:"oo",letters:/[\uA74F]/g},{base:"p",letters:/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},{base:"q",letters:/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},{base:"r",letters:/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},{base:"s",letters:/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},{base:"t",letters:/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},{base:"tz",letters:/[\uA729]/g},{base:"u",letters:/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},{base:"v",letters:/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},{base:"vy",letters:/[\uA761]/g},{base:"w",letters:/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},{base:"x",letters:/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},{base:"y",letters:/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},{base:"z",letters:/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}]}},{}],24:[function(a,b,c){b.exports=function(a){return{feedback:{className:"na",screenReaderText:a.dgettext("js-text-analysis","Feedback")},bad:{className:"bad",screenReaderText:a.dgettext("js-text-analysis","Bad SEO score")},ok:{className:"ok",screenReaderText:a.dgettext("js-text-analysis","Ok SEO score")},good:{className:"good",screenReaderText:a.dgettext("js-text-analysis","Good SEO score")}}}},{}],25:[function(a,b,c){b.exports=function(){return[" a"," in"," an"," on"," for"," the"," and"]}},{}],26:[function(a,b,c){b.exports=function(){return["a","about","above","after","again","against","all","am","an","and","any","are","as","at","be","because","been","before","being","below","between","both","but","by","could","did","do","does","doing","down","during","each","few","for","from","further","had","has","have","having","he","he'd","he'll","he's","her","here","here's","hers","herself","him","himself","his","how","how's","i","i'd","i'll","i'm","i've","if","in","into","is","it","it's","its","itself","let's","me","more","most","my","myself","nor","of","on","once","only","or","other","ought","our","ours","ourselves","out","over","own","same","she","she'd","she'll","she's","should","so","some","such","than","that","that's","the","their","theirs","them","themselves","then","there","there's","these","they","they'd","they'll","they're","they've","this","those","through","to","too","under","until","up","very","was","we","we'd","we'll","we're","we've","were","what","what's","when","when's","where","where's","which","while","who","who's","whom","why","why's","with","would","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves"]}},{}],27:[function(a,b,c){b.exports=function(){return{subtractSyllables:["cial","tia","cius","cious","giu","ion","iou","sia$","[^aeiuoyt]{2,}ed$","[aeiouy][^aeiuoyts]{1,}e\\b",".ely$","[cg]h?e[sd]","rved$","rved","[aeiouy][dt]es?$","[aeiouy][^aeiouydt]e[sd]?$","^[dr]e[aeiou][^aeiou]+$","[aeiouy]rse$"],
  addSyllables:["ia","riet","dien","iu","io","ii","[aeiouym][bdp]l","[aeiou]{3}","^mc","ism$","([^aeiouy])l$","[^l]lien","^coa[dglx].","[^gq]ua[^auieo]","dnt$","uity$","ie(r|st)","[aeiouy]ing","[aeiouw]y[aeiou]"],exclusionWords:[{word:"shoreline",syllables:2},{word:"simile",syllables:3}]}}},{}],28:[function(a,b,c){b.exports=function(a){Error.captureStackTrace(this,this.constructor),this.name=this.constructor.name,this.message=a},a("util").inherits(b.exports,Error)},{util:86}],29:[function(a,b,c){b.exports=function(a){Error.captureStackTrace(this,this.constructor),this.name=this.constructor.name,this.message=a},a("util").inherits(b.exports,Error)},{util:86}],30:[function(a,b,c){var d=function(a){return 0===a?"feedback":4>=a?"bad":a>4&&7>=a?"ok":a>7?"good":""};b.exports=d},{}],31:[function(a,b,c){var d=a("lodash/isUndefined"),e=a("lodash/forEach"),f=a("lodash/reduce"),g=a("lodash/isString"),h=a("lodash/isObject"),i=a("./errors/invalidType"),j=function(a){this.app=a,this.loaded=!1,this.preloadThreshold=3e3,this.plugins={},this.modifications={},this.customTests=[],setTimeout(this._pollLoadingPlugins.bind(this),1500)};j.prototype._registerPlugin=function(a,b){return"string"!=typeof a?(console.error("Failed to register plugin. Expected parameter `pluginName` to be a string."),!1):d(b)||"object"==typeof b?this._validateUniqueness(a)===!1?(console.error("Failed to register plugin. Plugin with name "+a+" already exists"),!1):(this.plugins[a]=b,this.app.updateLoadingDialog(this.plugins),!0):(console.error("Failed to register plugin "+a+". Expected parameters `options` to be a object."),!1)},j.prototype._ready=function(a){return"string"!=typeof a?(console.error("Failed to modify status for plugin "+a+". Expected parameter `pluginName` to be a string."),!1):d(this.plugins[a])?(console.error("Failed to modify status for plugin "+a+". The plugin was not properly registered."),!1):(this.plugins[a].status="ready",this.app.updateLoadingDialog(this.plugins),!0)},j.prototype._reloaded=function(a){return"string"!=typeof a?(console.error("Failed to reload Content Analysis for "+a+". Expected parameter `pluginName` to be a string."),!1):d(this.plugins[a])?(console.error("Failed to reload Content Analysis for plugin "+a+". The plugin was not properly registered."),!1):(this.app.analyzeTimer(),!0)},j.prototype._registerModification=function(a,b,c,e){if("string"!=typeof a)return console.error("Failed to register modification for plugin "+c+". Expected parameter `modification` to be a string."),!1;if("function"!=typeof b)return console.error("Failed to register modification for plugin "+c+". Expected parameter `callable` to be a function."),!1;if("string"!=typeof c)return console.error("Failed to register modification for plugin "+c+". Expected parameter `pluginName` to be a string."),!1;if(this._validateOrigin(c)===!1)return console.error("Failed to register modification for plugin "+c+". The integration has not finished loading yet."),!1;var f="number"==typeof e?e:10,g={callable:b,origin:c,priority:f};return d(this.modifications[a])&&(this.modifications[a]=[]),this.modifications[a].push(g),!0},j.prototype._registerTest=function(){console.error("This function is deprecated, please use _registerAssessment")},j.prototype._registerAssessment=function(a,b,c,d){if(!g(b))throw new i("Failed to register test for plugin "+d+". Expected parameter `name` to be a string.");if(!h(c))throw new i("Failed to register assessment for plugin "+d+". Expected parameter `assessment` to be a function.");if(!g(d))throw new i("Failed to register assessment for plugin "+d+". Expected parameter `pluginName` to be a string.");return b=d+"-"+b,a.addAssessment(b,c),!0},j.prototype._pollLoadingPlugins=function(a){a=d(a)?0:a,this._allReady()===!0?(this.loaded=!0,this.app.pluginsLoaded()):a>=this.preloadThreshold?this._pollTimeExceeded():(a+=50,setTimeout(this._pollLoadingPlugins.bind(this,a),50))},j.prototype._allReady=function(){return f(this.plugins,function(a,b){return a&&"ready"===b.status},!0)},j.prototype._pollTimeExceeded=function(){e(this.plugins,function(a,b){d(a.options)||"ready"===a.options.status||(console.error("Error: Plugin "+b+". did not finish loading in time."),delete this.plugins[b])}),this.loaded=!0,this.app.pluginsLoaded()},j.prototype._applyModifications=function(a,b,c){var d=this.modifications[a];return d instanceof Array&&d.length>0&&(d=this._stripIllegalModifications(d),d.sort(function(a,b){return a.priority-b.priority}),e(d,function(d){var e=d.callable,f=e(b,c);typeof f==typeof b?b=f:console.error("Modification with name "+a+" performed by plugin with name "+d.origin+" was ignored because the data that was returned by it was of a different type than the data we had passed it.")})),b},j.prototype._addPluginTests=function(a){this.customTests.map(function(b){this._addPluginTest(a,b)},this)},j.prototype._addPluginTest=function(a,b){a.addAnalysis({name:b.name,callable:b.analysis}),a.analyzeScorer.addScoring({name:b.name,scoring:b.scoring})},j.prototype._stripIllegalModifications=function(a){return e(a,function(b,c){this._validateOrigin(b.origin)===!1&&delete a[c]}.bind(this)),a},j.prototype._validateOrigin=function(a){return"ready"===this.plugins[a].status},j.prototype._validateUniqueness=function(a){return!!d(this.plugins[a])},b.exports=j},{"./errors/invalidType":28,"lodash/forEach":230,"lodash/isObject":245,"lodash/isString":248,"lodash/isUndefined":251,"lodash/reduce":259}],32:[function(a,b,c){var d=a("lodash/forEach"),e=a("lodash/isNumber"),f=a("lodash/isObject"),g=a("lodash/isUndefined"),h=a("lodash/difference"),i=a("../templates.js").assessmentPresenterResult,j=a("../interpreters/scoreToRating.js"),k=a("../config/presenter.js"),l=function(a){this.keyword=a.keyword,this.assessor=a.assessor,this.i18n=a.i18n,this.output=a.targets.output,this.overall=a.targets.overall||"overallScore",this.presenterConfig=k(a.i18n)};l.prototype.configHasProperty=function(a){return this.presenterConfig.hasOwnProperty(a)},l.prototype.getIndicator=function(a){return{className:this.getIndicatorColorClass(a),screenReaderText:this.getIndicatorScreenReaderText(a)}},l.prototype.getIndicatorColorClass=function(a){return this.configHasProperty(a)?this.presenterConfig[a].className:""},l.prototype.getIndicatorScreenReaderText=function(a){return this.configHasProperty(a)?this.presenterConfig[a].screenReaderText:""},l.prototype.resultToRating=function(a){return f(a)?(a.rating=j(a.score),a):""},l.prototype.getIndividualRatings=function(){var a={},b=this.sort(this.assessor.getValidResults()),c=b.map(this.resultToRating);return d(c,function(b,c){a[c]=this.addRating(b)}.bind(this)),a},l.prototype.excludeFromResults=function(a,b){return h(a,b)},l.prototype.sort=function(a){var b=this.getUndefinedScores(a),c=this.excludeFromResults(a,b);return c.sort(function(a,b){return a.score-b.score}),b.concat(c)},l.prototype.getUndefinedScores=function(a){return a.filter(function(a){return g(a.score)||0===a.score})},l.prototype.addRating=function(a){var b=this.getIndicator(a.rating);return b.text=a.text,b},l.prototype.getOverallRating=function(a){var b=0;return""===this.keyword?this.resultToRating({score:b}):(e(a)&&(b=a/10),this.resultToRating({score:b}))},l.prototype.render=function(){this.renderIndividualRatings(),this.renderOverallRating()},l.prototype.renderIndividualRatings=function(){var a=document.getElementById(this.output);a.innerHTML=i({scores:this.getIndividualRatings()})},l.prototype.renderOverallRating=function(){var a=this.getOverallRating(this.assessor.calculateOverallScore()),b=document.getElementById(this.overall);b&&(b.className="overallScore "+this.getIndicatorColorClass(a.rating))},b.exports=l},{"../config/presenter.js":24,"../interpreters/scoreToRating.js":30,"../templates.js":80,"lodash/difference":228,"lodash/forEach":230,"lodash/isNumber":244,"lodash/isObject":245,"lodash/isUndefined":251}],33:[function(a,b,c){var d=a("lodash/merge"),e=a("./errors/invalidType"),f=a("./errors/missingArgument"),g=a("lodash/isUndefined"),h=a("lodash/isEmpty"),i=a("./researches/wordCountInText.js"),j=a("./researches/getLinkStatistics.js"),k=a("./researches/countLinks.js"),l=a("./researches/urlIsTooLong.js"),m=a("./researches/findKeywordInPageTitle.js"),n=a("./researches/matchKeywordInSubheadings.js"),o=a("./researches/getKeywordDensity.js"),p=a("./researches/stopWordsInKeyword"),q=a("./researches/stopWordsInUrl"),r=a("./researches/calculateFleschReading.js"),s=a("./researches/metaDescriptionLength.js"),t=a("./researches/imageCountInText.js"),u=a("./researches/imageAltTags.js"),v=a("./researches/keyphraseLength"),w=a("./researches/metaDescriptionKeyword.js"),x=a("./researches/keywordCountInUrl"),y=a("./researches/findKeywordInFirstParagraph.js"),z=a("./researches/pageTitleLength.js"),A=function(a){this.setPaper(a),this.defaultResearches={urlLength:l,wordCountInText:i,findKeywordInPageTitle:m,calculateFleschReading:r,getLinkStatistics:j,linkCount:k,imageCount:t,altTagCount:u,matchKeywordInSubheadings:n,getKeywordDensity:o,stopWordsInKeyword:p,stopWordsInUrl:q,metaDescriptionLength:s,keyphraseLength:v,keywordCountInUrl:x,firstParagraph:y,metaDescriptionKeyword:w,pageTitleLength:z},this.customResearches={}};A.prototype.setPaper=function(a){this.paper=a},A.prototype.addResearch=function(a,b){if(g(a)||h(a))throw new f("Research name cannot be empty");if(!(b instanceof Function))throw new e("The research requires a Function callback.");this.customResearches[a]=b},A.prototype.hasResearch=function(a){return Object.keys(this.getAvailableResearches()).filter(function(b){return b===a}).length>0},A.prototype.getAvailableResearches=function(){return d(this.defaultResearches,this.customResearches)},A.prototype.getResearch=function(a){if(g(a)||h(a))throw new f("Research name cannot be empty");return this.hasResearch(a)?this.getAvailableResearches()[a](this.paper):!1},b.exports=A},{"./errors/invalidType":28,"./errors/missingArgument":29,"./researches/calculateFleschReading.js":34,"./researches/countLinks.js":35,"./researches/findKeywordInFirstParagraph.js":36,"./researches/findKeywordInPageTitle.js":37,"./researches/getKeywordDensity.js":38,"./researches/getLinkStatistics.js":39,"./researches/imageAltTags.js":41,"./researches/imageCountInText.js":42,"./researches/keyphraseLength":43,"./researches/keywordCountInUrl":44,"./researches/matchKeywordInSubheadings.js":45,"./researches/metaDescriptionKeyword.js":46,"./researches/metaDescriptionLength.js":47,"./researches/pageTitleLength.js":48,"./researches/stopWordsInKeyword":49,"./researches/stopWordsInUrl":51,"./researches/urlIsTooLong.js":52,"./researches/wordCountInText.js":53,"lodash/isEmpty":241,"lodash/isUndefined":251,"lodash/merge":255}],34:[function(a,b,c){var d=a("../stringProcessing/cleanText.js"),e=a("../stringProcessing/stripNumbers.js"),f=a("../stringProcessing/stripHTMLTags.js"),g=a("../stringProcessing/countSentences.js"),h=a("../stringProcessing/countWords.js"),i=a("../stringProcessing/countSyllables.js");b.exports=function(a){var b=a.getText();if(""===b)return 0;b=d(b),b=f(b);var c=h(b);b=e(b);var j=g(b),k=i(b),l=206.835-1.015*(c/j)-84.6*(k/c);return l.toFixed(1)}},{"../stringProcessing/cleanText.js":58,"../stringProcessing/countSentences.js":59,"../stringProcessing/countSyllables.js":60,"../stringProcessing/countWords.js":61,"../stringProcessing/stripHTMLTags.js":74,"../stringProcessing/stripNumbers.js":76}],35:[function(a,b,c){var d=a("./getLinks");b.exports=function(a){var b=a.getText(),c=d(b);return c.length}},{"./getLinks":40}],36:[function(a,b,c){var d=a("../stringProcessing/matchStringWithRegex.js"),e=a("../stringProcessing/matchTextWithWord.js");b.exports=function(a){var b,c=a.getText(),f=a.getKeyword();return b=d(c,"<p(?:[^>]+)?>(.*?)</p>"),b.length>0?e(b[0],f):(b=d(c,"[^]*?\n\n"),b.length>0?e(b[0],f):e(c,f))}},{"../stringProcessing/matchStringWithRegex.js":68,"../stringProcessing/matchTextWithWord.js":69}],37:[function(a,b,c){var d=a("../stringProcessing/matchTextWithWord.js");b.exports=function(a){var b=a.getTitle(),c=a.getKeyword(),e={matches:0,position:-1};return e.matches=d(b,c),e.position=b.toLocaleLowerCase().indexOf(c),e}},{"../stringProcessing/matchTextWithWord.js":69}],38:[function(a,b,c){var d=a("../stringProcessing/countWords.js"),e=a("../stringProcessing/matchTextWithWord.js");b.exports=function(a){var b=a.getKeyword(),c=a.getText(),f=d(c);if(0===f)return 0;var g=e(c,b);return g/f*100}},{"../stringProcessing/countWords.js":61,"../stringProcessing/matchTextWithWord.js":69}],39:[function(a,b,c){var d=a("./getLinks.js"),e=a("../stringProcessing/findKeywordInUrl.js"),f=a("../stringProcessing/getLinkType.js"),g=a("../stringProcessing/checkNofollow.js");b.exports=function(a){for(var b,c=a.getText(),h=a.getKeyword(),i=a.getUrl(),j=d(c),k={total:j.length,totalNaKeyword:0,totalKeyword:0,internalTotal:0,internalDofollow:0,internalNofollow:0,externalTotal:0,externalDofollow:0,externalNofollow:0,otherTotal:0,otherDofollow:0,otherNofollow:0},l=0;l<j.length;l++){b=h?e(j[l],h):!1,b&&k.totalKeyword++;var m=f(j[l],i);k[m+"Total"]++;var n=g(j[l]);k[m+n]++}return k}},{"../stringProcessing/checkNofollow.js":57,"../stringProcessing/findKeywordInUrl.js":63,"../stringProcessing/getLinkType.js":66,"./getLinks.js":40}],40:[function(a,b,c){var d=a("../stringProcessing/getAnchorsFromText.js");b.exports=function(a){return d(a)}},{"../stringProcessing/getAnchorsFromText.js":65}],41:[function(a,b,c){var d=a("../stringProcessing/imageInText"),e=a("../stringProcessing/getAlttagContent"),f=a("../stringProcessing/matchTextWithWord"),g=function(a,b){for(var c={noAlt:0,withAlt:0,withAltKeyword:0,withAltNonKeyword:0},d=0;d<a.length;d++){var g=e(a[d]);""!==g?""!==b||""===g?0!==f(g,b)||""===g?f(g,b)>0&&c.withAltKeyword++:c.withAltNonKeyword++:c.withAlt++:c.noAlt++}return c};b.exports=function(a){return g(d(a.getText()),a.getKeyword())}},{"../stringProcessing/getAlttagContent":64,"../stringProcessing/imageInText":67,"../stringProcessing/matchTextWithWord":69}],42:[function(a,b,c){var d=a("./../stringProcessing/imageInText");b.exports=function(a){return d(a.getText()).length}},{"./../stringProcessing/imageInText":67}],43:[function(a,b,c){function d(a){var b=f(a.getKeyword());return e(b)}var e=a("../stringProcessing/countWords"),f=a("../stringProcessing/sanitizeString");b.exports=d},{"../stringProcessing/countWords":61,"../stringProcessing/sanitizeString":72}],44:[function(a,b,c){var d=a("../stringProcessing/matchTextWithWord.js");b.exports=function(a){var b=a.getKeyword().replace("'","").replace(/\s/gi,"-");return d(a.getUrl(),b)}},{"../stringProcessing/matchTextWithWord.js":69}],45:[function(a,b,c){var d=a("../stringProcessing/stripNonTextTags.js"),e=a("../stringProcessing/subheadingsMatch.js");b.exports=function(a){var b,c=a.getText(),f=a.getKeyword(),g={count:0};return c=d(c),b=c.match(/<h([1-6])(?:[^>]+)?>(.*?)<\/h\1>/gi),null!==b&&(g.count=b.length,g.matches=e(b,f)),g}},{"../stringProcessing/stripNonTextTags.js":75,"../stringProcessing/subheadingsMatch.js":78}],46:[function(a,b,c){var d=a("../stringProcessing/matchTextWithWord.js");b.exports=function(a){return""===a.getDescription()?-1:d(a.getDescription(),a.getKeyword())}},{"../stringProcessing/matchTextWithWord.js":69}],47:[function(a,b,c){b.exports=function(a){return a.getDescription().length}},{}],48:[function(a,b,c){b.exports=function(a){return a.getTitle().length}},{}],49:[function(a,b,c){var d=a("./stopWordsInText.js");b.exports=function(a){return d(a.getKeyword())}},{"./stopWordsInText.js":50}],50:[function(a,b,c){var d=a("../config/stopwords.js")(),e=a("../stringProcessing/stringToRegex.js");b.exports=function(a){var b,c=[];for(b=0;b<d.length;b++)null!==a.match(e(d[b]))&&c.push(d[b]);return c}},{"../config/stopwords.js":26,"../stringProcessing/stringToRegex.js":73}],51:[function(a,b,c){var d=a("./stopWordsInText.js");b.exports=function(a){return d(a.getUrl().replace(/[-_]/g," "))}},{"./stopWordsInText.js":50}],52:[function(a,b,c){b.exports=function(a){var b=a.getUrl().length,c=a.getKeyword().length,d=40,e=20;return b>d&&b>c+e}},{}],53:[function(a,b,c){var d=a("../stringProcessing/countWords.js");b.exports=function(a){return d(a.getText())}},{"../stringProcessing/countWords.js":61}],54:[function(a,b,c){var d=a("./assessor.js"),e=a("./assessments/fleschReadingEaseAssessment.js"),f=a("./assessments/introductionKeywordAssessment.js"),g=a("./assessments/keyphraseLengthAssessment.js"),h=a("./assessments/keywordDensityAssessment.js"),i=a("./assessments/keywordStopWordsAssessment.js"),j=a("./assessments/metaDescriptionKeywordAssessment.js"),k=a("./assessments/metaDescriptionLengthAssessment.js"),l=a("./assessments/subheadingsKeywordAssessment.js"),m=a("./assessments/textCompetingLinksAssessment.js"),n=a("./assessments/textImagesAssessment.js"),o=a("./assessments/textLengthAssessment.js"),p=a("./assessments/textLinksAssessment.js"),q=a("./assessments/textSubheadingsAssessment.js"),r=a("./assessments/titleKeywordAssessment.js"),s=a("./assessments/titleLengthAssessment.js"),t=a("./assessments/urlKeywordAssessment.js"),u=a("./assessments/urlLengthAssessment.js"),v=a("./assessments/urlStopWordsAssessment.js"),w=function(a){d.call(this,a),this._assessments={fleschReadingEase:e,introductionKeyword:f,keyphraseLength:g,keywordDensity:h,keywordStopWords:i,metaDescriptionKeyword:j,metaDescriptionLength:k,subheadingsKeyword:l,textCompetingLinks:m,textImages:n,textLength:o,textLinks:p,textSubheadings:q,titleKeyword:r,titleLength:s,urlKeyword:t,urlLength:u,urlStopWords:v}};b.exports=w,a("util").inherits(b.exports,d)},{"./assessments/fleschReadingEaseAssessment.js":2,"./assessments/introductionKeywordAssessment.js":3,"./assessments/keyphraseLengthAssessment.js":4,"./assessments/keywordDensityAssessment.js":5,"./assessments/keywordStopWordsAssessment.js":6,"./assessments/metaDescriptionKeywordAssessment.js":7,"./assessments/metaDescriptionLengthAssessment.js":8,"./assessments/subheadingsKeywordAssessment.js":9,"./assessments/textCompetingLinksAssessment.js":10,"./assessments/textImagesAssessment.js":11,"./assessments/textLengthAssessment.js":12,"./assessments/textLinksAssessment.js":13,"./assessments/textSubheadingsAssessment.js":14,"./assessments/titleKeywordAssessment.js":15,"./assessments/titleLengthAssessment.js":16,"./assessments/urlKeywordAssessment.js":17,"./assessments/urlLengthAssessment.js":18,"./assessments/urlStopWordsAssessment.js":19,"./assessor.js":20,util:86}],55:[function(a,b,c){function d(a){return this.data[a]}function e(a,b){this.element.input[a].value=b,this.data[a]=b}function f(a,b){var c=a.className.split(" ");-1===c.indexOf(b)&&c.push(b),a.className=c.join(" ")}function g(a,b){var c=a.className.split(" "),d=c.indexOf(b);-1!==d&&c.splice(d,1),a.className=c.join(" ")}function h(a,b){t(b,g.bind(null,a))}function i(a){return a.indexOf("/")===a.length-1}function j(){var a=document.createElement("progress");return!q(a.max)}function k(a){var b;switch(!0){case a>0&&34>=a:case a>=66:b="ok";break;case a>=35&&65>=a:b="good";break;default:b="bad"}return b}function l(a){var b;switch(!0){case a>0&&120>=a:case a>=157:b="ok";break;case a>=120&&157>=a:b="good";break;default:b="bad"}return b}function m(a,b,c,d){var e,g,i=["snippet-editor__progress--bad","snippet-editor__progress--ok","snippet-editor__progress--good"];a.value=b,h(a,i),f(a,"snippet-editor__progress--"+d),this.hasProgressSupport||(e=a.getElementsByClassName("snippet-editor__progress-bar")[0],g=b/c*100,e.style.width=g+"%")}function n(){var a=this.data.title;return o(a)&&(a=this.opts.defaultValue.title),a=this.refObj.pluggable._applyModifications("data_page_title",a),y(a)}var o=a("lodash/isEmpty"),p=a("lodash/isElement"),q=a("lodash/isUndefined"),r=a("lodash/clone"),s=a("lodash/defaultsDeep"),t=a("lodash/forEach"),u=a("lodash/debounce"),v=a("../js/stringProcessing/stringToRegex.js"),w=a("../js/stringProcessing/stripHTMLTags.js"),x=a("../js/stringProcessing/sanitizeString.js"),y=a("../js/stringProcessing/stripSpaces.js"),z=a("../js/stringProcessing/replaceDiacritics.js"),A=a("./config/config.js"),B=a("./templates.js").snippetEditor,C={data:{title:"",metaDesc:"",urlPath:""},placeholder:{title:"This is an example title - edit by clicking here",metaDesc:"Modify your meta description by editing it right here",urlPath:"example-post/"},defaultValue:{title:"",metaDesc:""},baseURL:"http://example.com/",callbacks:{saveSnippetData:function(){}},addTrailingSlash:!0,metaDescriptionDate:""},D=65,E=[{preview:"title_container",inputField:"title"},{preview:"url_container",inputField:"urlPath"},{preview:"meta_container",inputField:"metaDesc"}],F=function(){var a=this.opts.baseURL;return o(this.refObj.rawData.baseUrl)||this.opts.baseURL!==C.baseURL||(a=this.refObj.rawData.baseUrl),a},G=function(a){if(s(a,C),this.data=a.data,q(a.analyzerApp)||(this.refObj=a.analyzerApp,this.i18n=this.refObj.i18n,this.data={title:this.refObj.rawData.snippetTitle||"",urlPath:this.refObj.rawData.snippetCite||"",metaDesc:this.refObj.rawData.snippetMeta||""},o(this.refObj.rawData.pageTitle)||(a.placeholder.title=this.refObj.rawData.pageTitle)),!p(a.targetElement))throw new Error("The snippet preview requires a valid target element");this.opts=a,this._currentFocus=null,this._currentHover=null,this.unformattedText={},Object.defineProperty(this.unformattedText,"snippet_cite",{get:d.bind(this,"urlPath"),set:e.bind(this,"urlPath")}),Object.defineProperty(this.unformattedText,"snippet_meta",{get:d.bind(this,"metaDesc"),set:e.bind(this,"metaDesc")}),Object.defineProperty(this.unformattedText,"snippet_title",{get:d.bind(this,"title"),set:e.bind(this,"title")})};G.prototype.renderTemplate=function(){var a=this.opts.targetElement;a.innerHTML=B({raw:{title:this.data.title,snippetCite:this.data.urlPath,meta:this.data.metaDesc},rendered:{title:this.formatTitle(),baseUrl:this.formatUrl(),snippetCite:this.formatCite(),meta:this.formatMeta()},metaDescriptionDate:this.opts.metaDescriptionDate,placeholder:this.opts.placeholder,i18n:{edit:this.i18n.dgettext("js-text-analysis","Edit snippet"),title:this.i18n.dgettext("js-text-analysis","SEO title"),slug:this.i18n.dgettext("js-text-analysis","Slug"),metaDescription:this.i18n.dgettext("js-text-analysis","Meta description"),save:this.i18n.dgettext("js-text-analysis","Close snippet editor"),snippetPreview:this.i18n.dgettext("js-text-analysis","Snippet preview")}}),this.element={rendered:{title:document.getElementById("snippet_title"),urlBase:document.getElementById("snippet_citeBase"),urlPath:document.getElementById("snippet_cite"),metaDesc:document.getElementById("snippet_meta")},input:{title:a.getElementsByClassName("js-snippet-editor-title")[0],urlPath:a.getElementsByClassName("js-snippet-editor-slug")[0],metaDesc:a.getElementsByClassName("js-snippet-editor-meta-description")[0]},progress:{title:a.getElementsByClassName("snippet-editor__progress-title")[0],metaDesc:a.getElementsByClassName("snippet-editor__progress-meta-description")[0]},container:document.getElementById("snippet_preview"),formContainer:a.getElementsByClassName("snippet-editor__form")[0],editToggle:a.getElementsByClassName("snippet-editor__edit-button")[0],closeEditor:a.getElementsByClassName("snippet-editor__submit")[0],formFields:a.getElementsByClassName("snippet-editor__form-field")},this.element.label={title:this.element.input.title.parentNode,urlPath:this.element.input.urlPath.parentNode,metaDesc:this.element.input.metaDesc.parentNode},this.element.preview={title:this.element.rendered.title.parentNode,urlPath:this.element.rendered.urlPath.parentNode,metaDesc:this.element.rendered.metaDesc.parentNode},this.hasProgressSupport=j(),this.hasProgressSupport?(this.element.progress.title.max=D,this.element.progress.metaDesc.max=A.maxMeta):t(this.element.progress,function(a){f(a,"snippet-editor__progress--fallback")}),this.opened=!1,this.updateProgressBars()},G.prototype.refresh=function(){this.output=this.htmlOutput(),this.renderOutput(),this.renderSnippetStyle(),this.updateProgressBars()};var H=function(){var a=this.data.metaDesc;return o(a)&&(a=this.opts.defaultValue.metaDesc),a=this.refObj.pluggable._applyModifications("data_meta_desc",a),o(this.opts.metaDescriptionDate)||o(a)||(a=this.opts.metaDescriptionDate+" - "+this.data.metaDesc),y(a)};G.prototype.getAnalyzerData=function(){return{title:n.call(this),url:this.data.urlPath,metaDesc:H.call(this)}},G.prototype.callRegisteredEventBinder=function(){this.refObj.callbacks.bindElementEvents(this.refObj)},G.prototype.init=function(){null!==this.refObj.rawData.pageTitle&&null!==this.refObj.rawData.cite&&this.refresh()},G.prototype.htmlOutput=function(){var a={};return a.title=this.formatTitle(),a.cite=this.formatCite(),a.meta=this.formatMeta(),a.url=this.formatUrl(),a},G.prototype.formatTitle=function(){var a=this.data.title;return o(a)&&(a=this.opts.defaultValue.title),o(a)&&(a=this.opts.placeholder.title),this.refObj.pluggable.loaded&&(a=this.refObj.pluggable._applyModifications("data_page_title",a)),a=w(a),o(this.refObj.rawData.keyword)||(a=this.formatKeyword(a)),o(a)&&(a=this.i18n.dgettext("js-text-analysis","Please provide an SEO title by editing the snippet below.")),a},G.prototype.formatUrl=function(){var a=F.call(this);return a.replace(/http:\/\//gi,"")},G.prototype.formatCite=function(){var a=this.data.urlPath;return a=z(w(a)),o(a)&&(a=this.opts.placeholder.urlPath),o(this.refObj.rawData.keyword)||(a=this.formatKeywordUrl(a)),this.opts.addTrailingSlash&&!i(a)&&(a+="/"),a=a.replace(/\s/g,"-")},G.prototype.formatMeta=function(){var a=this.data.metaDesc;return o(a)&&(a=this.getMetaText()),this.refObj.pluggable.loaded&&(a=this.refObj.pluggable._applyModifications("data_meta_desc",a)),a=w(a),a=a.substring(0,A.maxMeta),o(this.refObj.rawData.keyword)||(a=this.formatKeyword(a)),o(a)&&(a=this.i18n.dgettext("js-text-analysis","Please provide a meta description by editing the snippet below.")),a},G.prototype.getMetaText=function(){var a=this.opts.defaultValue.metaDesc;return!q(this.refObj.rawData.excerpt)&&o(a)&&(a=this.refObj.rawData.excerpt),!q(this.refObj.rawData.text)&&o(a)&&(a=this.refObj.rawData.text,this.refObj.pluggable.loaded&&(a=this.refObj.pluggable._applyModifications("content",a))),a=w(a),a.substring(0,A.maxMeta)},G.prototype.getIndexMatches=function(){for(var a=[],b=0,c=this.refObj.rawData.text.indexOf(this.refObj.rawData.keyword,b);c>-1;)a.push(c),b=c+this.refObj.rawData.keyword.length,c=this.refObj.rawData.text.indexOf(this.refObj.rawData.keyword,b);return a},G.prototype.getPeriodMatches=function(){for(var a,b=[0],c=0;(a=this.refObj.rawData.text.indexOf(".",c))>-1;)b.push(a),c=a+1;return b},G.prototype.formatKeyword=function(a){var b=this.refObj.rawData.keyword.replace(/[\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g," "),c=v(b,"",!1);return a.replace(c,function(a){return"<strong>"+a+"</strong>"})},G.prototype.formatKeywordUrl=function(a){var b=x(this.refObj.rawData.keyword);b=b.replace(/'/,"");var c=b.replace(/\s/g,"-"),d=v(c,"\\-");return a.replace(d,function(a){return"<strong>"+a+"</strong>"})},G.prototype.renderOutput=function(){this.element.rendered.title.innerHTML=this.output.title,this.element.rendered.urlPath.innerHTML=this.output.cite,this.element.rendered.urlBase.innerHTML=this.output.url,this.element.rendered.metaDesc.innerHTML=this.output.meta},G.prototype.renderSnippetStyle=function(){var a=this.element.rendered.metaDesc,b=H.call(this);o(b)?(f(a,"desc-render"),g(a,"desc-default")):(f(a,"desc-default"),g(a,"desc-render"))},G.prototype.reRender=function(){this.init()},G.prototype.checkTextLength=function(a){var b=a.currentTarget.textContent;switch(a.currentTarget.id){case"snippet_meta":a.currentTarget.className="desc",b.length>A.maxMeta&&(YoastSEO.app.snippetPreview.unformattedText.snippet_meta=a.currentTarget.textContent,a.currentTarget.textContent=b.substring(0,A.maxMeta));break;case"snippet_title":a.currentTarget.className="title",b.length>D&&(YoastSEO.app.snippetPreview.unformattedText.snippet_title=a.currentTarget.textContent,a.currentTarget.textContent=b.substring(0,D))}},G.prototype.getUnformattedText=function(a){var b=a.currentTarget.id;"undefined"!=typeof this.unformattedText[b]&&(a.currentTarget.textContent=this.unformattedText[b])},G.prototype.setUnformattedText=function(a){var b=a.currentTarget.id;this.unformattedText[b]=document.getElementById(b).textContent},G.prototype.validateFields=function(){var a=H.call(this),b=n.call(this);a.length>A.maxMeta?f(this.element.input.metaDesc,"snippet-editor__field--invalid"):g(this.element.input.metaDesc,"snippet-editor__field--invalid"),b.length>D?f(this.element.input.title,"snippet-editor__field--invalid"):g(this.element.input.title,"snippet-editor__field--invalid")},G.prototype.updateProgressBars=function(){var a,b,c,d;c=H.call(this),d=n.call(this),b=k(d.length),a=l(c.length),m(this.element.progress.title,d.length,D,b),m(this.element.progress.metaDesc,c.length,A.maxMeta,a)},G.prototype.bindEvents=function(){var a,b=["title","slug","meta-description"];t(b,function(b){a=document.getElementsByClassName("js-snippet-editor-"+b)[0],a.addEventListener("keydown",this.changedInput.bind(this)),a.addEventListener("keyup",this.changedInput.bind(this)),a.addEventListener("input",this.changedInput.bind(this)),a.addEventListener("focus",this.changedInput.bind(this)),a.addEventListener("blur",this.changedInput.bind(this))}.bind(this)),this.element.editToggle.addEventListener("click",this.toggleEditor.bind(this)),this.element.closeEditor.addEventListener("click",this.closeEditor.bind(this)),t(E,function(a){var b=document.getElementById(a.preview),c=this.element.input[a.inputField];b.addEventListener("click",function(){this.openEditor(),c.focus()}.bind(this)),c.addEventListener("focus",function(){this._currentFocus=a.inputField,this._updateFocusCarets()}.bind(this)),c.addEventListener("blur",function(){this._currentFocus=null,this._updateFocusCarets()}.bind(this)),b.addEventListener("mouseover",function(){this._currentHover=a.inputField,this._updateHoverCarets()}.bind(this)),b.addEventListener("mouseout",function(){this._currentHover=null,this._updateHoverCarets()}.bind(this))}.bind(this))},G.prototype.changedInput=u(function(){this.updateDataFromDOM(),this.validateFields(),this.updateProgressBars(),this.refresh(),this.refObj.refresh()},25),G.prototype.updateDataFromDOM=function(){this.data.title=this.element.input.title.value,this.data.urlPath=this.element.input.urlPath.value,this.data.metaDesc=this.element.input.metaDesc.value,this.opts.callbacks.saveSnippetData(r(this.data))},G.prototype.openEditor=function(){this.element.editToggle.setAttribute("aria-expanded","true"),g(this.element.formContainer,"snippet-editor--hidden"),this.opened=!0},G.prototype.closeEditor=function(){f(this.element.formContainer,"snippet-editor--hidden"),this.element.editToggle.setAttribute("aria-expanded","false"),this.element.editToggle.focus(),this.opened=!1},G.prototype.toggleEditor=function(){this.opened?this.closeEditor():this.openEditor()},G.prototype._updateFocusCarets=function(){var a,b;t(this.element.label,function(a){g(a,"snippet-editor__label--focus")}),t(this.element.preview,function(a){g(a,"snippet-editor__container--focus")}),null!==this._currentFocus&&(a=this.element.label[this._currentFocus],b=this.element.preview[this._currentFocus],f(a,"snippet-editor__label--focus"),f(b,"snippet-editor__container--focus"))},G.prototype._updateHoverCarets=function(){var a;t(this.element.label,function(a){g(a,"snippet-editor__label--hover")}),null!==this._currentHover&&(a=this.element.label[this._currentHover],f(a,"snippet-editor__label--hover"))},G.prototype.setTitle=function(a){this.element.input.title.value=a,this.changedInput()},G.prototype.setUrlPath=function(a){this.element.input.urlPath.value=a,this.changedInput()},G.prototype.setTitle=function(a){this.element.input.metaDesc.value=a,this.changedInput()},G.prototype.disableEnter=function(a){},G.prototype.textFeedback=function(a){},G.prototype.showEditIcon=function(a){},G.prototype.hideEditIcon=function(){},G.prototype.setFocus=function(a){},b.exports=G;
},{"../js/stringProcessing/replaceDiacritics.js":70,"../js/stringProcessing/sanitizeString.js":72,"../js/stringProcessing/stringToRegex.js":73,"../js/stringProcessing/stripHTMLTags.js":74,"../js/stringProcessing/stripSpaces.js":77,"./config/config.js":22,"./templates.js":80,"lodash/clone":224,"lodash/debounce":225,"lodash/defaultsDeep":227,"lodash/forEach":230,"lodash/isElement":240,"lodash/isEmpty":241,"lodash/isUndefined":251}],56:[function(a,b,c){b.exports=function(a,b){var c,d,e;return"undefined"==typeof b&&(b=""),c="[ \n\r	.,'()\"+-;!?:/»«‹›"+b+"<>]",d="(^|"+c+")",e="($|"+c+")",d+a+e}},{}],57:[function(a,b,c){b.exports=function(a){var b="Dofollow";return null!==a.match(/rel=([\'\"])nofollow\1/gi)&&(b="Nofollow"),b}},{}],58:[function(a,b,c){var d=a("../stringProcessing/stripSpaces.js"),e=a("../stringProcessing/replaceDiacritics.js"),f=a("../stringProcessing/unifyWhitespace.js");b.exports=function(a){return""===a?a:(a=e(a),a=a.toLocaleLowerCase(),a=f(a),a=a.replace(/[\-\;\:\,\(\)\"\'\|\“\”]/g," "),a=a.replace(/[\’]/g,""),a=a.replace(/[.?!]/g,"."),a=d(a),a+=".",a=a.replace(/[ ]*(\n|\r\n|\r)[ ]*/g," "),a=a.replace(/([\.])[\. ]+/g,"$1"),a=a.replace(/[ ]*([\.])+/g,"$1 "),a=d(a),"."===a?"":a)}},{"../stringProcessing/replaceDiacritics.js":70,"../stringProcessing/stripSpaces.js":77,"../stringProcessing/unifyWhitespace.js":79}],59:[function(a,b,c){var d=a("../stringProcessing/cleanText.js");b.exports=function(a){for(var b=d(a).split("."),c=0,e=0;e<b.length;e++)""!==b[e]&&" "!==b[e]&&c++;return c}},{"../stringProcessing/cleanText.js":58}],60:[function(a,b,c){var d=a("../stringProcessing/cleanText.js"),e=a("../config/syllables.js"),f=a("../stringProcessing/createRegexFromArray.js"),g=function(a){var b,c,d,f=0;b=e().exclusionWords;for(var g=0;g<b.length;g++)c=new RegExp(b[g].word,"ig"),d=a.match(c),null!==d&&(f+=d.length*b[g].syllables);return f},h=function(a){for(var b=e().exclusionWords,c=[],d=0;d<b.length;d++)c.push(b[d].word);return a.replace(f(c),"")},i=function(a){var b,c,d,e=a.split(" "),f=0;for(b=0;b<e.length;b++)for(d=e[b].split(/[^aeiouy]/g),c=0;c<d.length;c++)""!==d[c]&&f++;return f},j=function(a,b){var c,d=0,g=a.split(" "),h="";switch(b){case"add":h=f(e().addSyllables,!0);break;case"subtract":h=f(e().subtractSyllables,!0)}for(var i=0;i<g.length;i++)c=g[i].match(h),null!==c&&(d+=c.length);return d};b.exports=function(a){var b=0;return b+=g(a),a=h(a),a=d(a),a.replace(/[.]/g," "),b+=i(a),b+=j(a,"add"),b-=j(a,"subtract")}},{"../config/syllables.js":27,"../stringProcessing/cleanText.js":58,"../stringProcessing/createRegexFromArray.js":62}],61:[function(a,b,c){var d=a("../stringProcessing/stripHTMLTags.js"),e=a("../stringProcessing/stripSpaces.js");b.exports=function(a){return a=e(d(a)),""===a?0:a.split(/\s/g).length}},{"../stringProcessing/stripHTMLTags.js":74,"../stringProcessing/stripSpaces.js":77}],62:[function(a,b,c){var d=a("../stringProcessing/addWordboundary.js");b.exports=function(a,b){var c;return a=a.map(function(a){return b?a:d(a)}),c="("+a.join(")|(")+")",new RegExp(c,"ig")}},{"../stringProcessing/addWordboundary.js":56}],63:[function(a,b,c){var d=a("../stringProcessing/stringToRegex.js");b.exports=function(a,b){var c=!1,e=a.match(/>(.*)/gi);return null!==e&&(e=e[0].replace(/<.*?>\s?/gi,""),null!==e.match(d(b))&&(c=!0)),c}},{"../stringProcessing/stringToRegex.js":73}],64:[function(a,b,c){var d=a("../stringProcessing/stripSpaces.js"),e=/alt=(['"])(.*?)\1/i;b.exports=function(a){var b="",c=a.match(e);return null!==c&&(b=d(c[2]),b=b.replace(/&quot;/g,'"'),b=b.replace(/&#039;/g,"'")),b}},{"../stringProcessing/stripSpaces.js":77}],65:[function(a,b,c){b.exports=function(a){var b;return b=a.match(/<a(?:[^>]+)?>(.*?)<\/a>/gi),null===b&&(b=[]),b}},{}],66:[function(a,b,c){b.exports=function(a,b){var c="other";if(null!==a.match(/https?:\/\//gi)){c="external";var d=a.match(b);null!==d&&0!==d[0].length&&(c="internal")}return c}},{}],67:[function(a,b,c){var d=a("./matchStringWithRegex.js");b.exports=function(a){return d(a,"<img(?:[^>]+)?>")}},{"./matchStringWithRegex.js":68}],68:[function(a,b,c){b.exports=function(a,b){var c=new RegExp(b,"ig"),d=a.match(c);return null===d&&(d=[]),d}},{}],69:[function(a,b,c){var d=a("../stringProcessing/stringToRegex.js"),e=a("../stringProcessing/stripNonTextTags.js"),f=a("../stringProcessing/unifyWhitespace.js"),g=a("../stringProcessing/replaceDiacritics.js");b.exports=function(a,b,c){a=e(a),a=f(a),a=g(a);var h=a.match(d(b,c));return null===h?0:h.length}},{"../stringProcessing/replaceDiacritics.js":70,"../stringProcessing/stringToRegex.js":73,"../stringProcessing/stripNonTextTags.js":75,"../stringProcessing/unifyWhitespace.js":79}],70:[function(a,b,c){var d=a("../config/diacritics.js");b.exports=function(a){for(var b=d(),c=0;c<b.length;c++)a=a.replace(b[c].letters,b[c].base);return a}},{"../config/diacritics.js":23}],71:[function(a,b,c){b.exports=function(a,b,c){return a=a.replace(b,c)}},{}],72:[function(a,b,c){var d=a("../stringProcessing/stripHTMLTags.js"),e=a("../stringProcessing/stripSpaces.js");b.exports=function(a){return a=a.replace(/[\[\]\/\{\}\(\)\*\+\?\\\^\$\|]/g,""),a=d(a),a=e(a)}},{"../stringProcessing/stripHTMLTags.js":74,"../stringProcessing/stripSpaces.js":77}],73:[function(a,b,c){var d=a("lodash/isUndefined"),e=a("../stringProcessing/replaceDiacritics.js"),f=a("../stringProcessing/sanitizeString.js"),g=a("../stringProcessing/addWordboundary.js");b.exports=function(a,b,c){return d(b)&&(b=""),(d(c)||c===!0)&&(a=e(a)),a=f(a),a=g(a,b),new RegExp(a,"ig")}},{"../stringProcessing/addWordboundary.js":56,"../stringProcessing/replaceDiacritics.js":70,"../stringProcessing/sanitizeString.js":72,"lodash/isUndefined":251}],74:[function(a,b,c){var d=a("../stringProcessing/stripSpaces.js");b.exports=function(a){return a=a.replace(/(<([^>]+)>)/gi," "),a=d(a)}},{"../stringProcessing/stripSpaces.js":77}],75:[function(a,b,c){var d=a("../stringProcessing/stripSpaces.js");b.exports=function(a){return a=a.replace(/<(?!li|\/li|p|\/p|h1|\/h1|h2|\/h2|h3|\/h3|h4|\/h4|h5|\/h5|h6|\/h6|dd).*?\>/g,""),a=d(a)}},{"../stringProcessing/stripSpaces.js":77}],76:[function(a,b,c){var d=a("../stringProcessing/stripSpaces.js");b.exports=function(a){return a=a.replace(/\b[0-9]+\b/g,""),a=d(a),"."===a&&(a=""),a}},{"../stringProcessing/stripSpaces.js":77}],77:[function(a,b,c){b.exports=function(a){return a=a.replace(/\s{2,}/g," "),a=a.replace(/\s\./g,"."),a=a.replace(/^\s+|\s+$/g,"")}},{}],78:[function(a,b,c){var d=a("../stringProcessing/stringToRegex.js"),e=a("../stringProcessing/replaceString.js"),f=a("../config/removalWords.js"),g=a("../stringProcessing/replaceDiacritics.js");b.exports=function(a,b){var c;if(null===a)c=-1;else{c=0;for(var h=0;h<a.length;h++){var i=e(a[h],f);(g(i).match(d(b))||g(a[h]).match(d(b)))&&c++}}return c}},{"../config/removalWords.js":25,"../stringProcessing/replaceDiacritics.js":70,"../stringProcessing/replaceString.js":71,"../stringProcessing/stringToRegex.js":73}],79:[function(a,b,c){b.exports=function(a){return a=a.replace("&nbsp;"," "),a=a.replace(/\s/g," ")}},{}],80:[function(require,module,exports){(function(global){(function(){function checkGlobal(a){return a&&a.Object===Object?a:null}function checkGlobal(a){return a&&a.Object===Object?a:null}function escapeHtmlChar(a){return htmlEscapes[a]}function baseToString(a){if("string"==typeof a)return a;if(isSymbol(a))return symbolToString?symbolToString.call(a):"";var b=a+"";return"0"==b&&1/a==-INFINITY?"-0":b}function isObjectLike(a){return!!a&&"object"==typeof a}function isSymbol(a){return"symbol"==typeof a||isObjectLike(a)&&objectToString.call(a)==symbolTag}function toString(a){return null==a?"":baseToString(a)}function escape(a){return a=toString(a),a&&reHasUnescapedHtml.test(a)?a.replace(reUnescapedHtml,escapeHtmlChar):a}var undefined,undefined,freeExports="object"==typeof exports&&exports,freeModule=freeExports&&"object"==typeof module&&module,freeGlobal=checkGlobal("object"==typeof global&&global),freeSelf=checkGlobal("object"==typeof self&&self),thisGlobal=checkGlobal("object"==typeof this&&this),root=freeGlobal||freeSelf||thisGlobal||Function("return this")(),INFINITY=1/0,symbolTag="[object Symbol]",reUnescapedHtml=/[&<>"'`]/g,reHasUnescapedHtml=RegExp(reUnescapedHtml.source),htmlEscapes={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"},freeGlobal=checkGlobal("object"==typeof global&&global),freeSelf=checkGlobal("object"==typeof self&&self),thisGlobal=checkGlobal("object"==typeof this&&this),root=freeGlobal||freeSelf||thisGlobal||Function("return this")(),objectProto=Object.prototype,objectToString=objectProto.toString,Symbol=root.Symbol,symbolProto=Symbol?Symbol.prototype:undefined,symbolToString=symbolProto?symbolProto.toString:undefined,_={escape:escape},templates={assessmentPresenterResult:{},snippetEditor:{}};templates.assessmentPresenterResult=function(obj){obj||(obj={});var __t,__p="",__e=_.escape;Array.prototype.join;with(obj){__p+='<ul class="wpseoanalysis">\n    ';for(var i in scores)__p+='\n        <li class="score">\n            <span class="wpseo-score-icon '+__e(scores[i].className)+'"></span>\n            <span class="screen-reader-text">'+(null==(__t=scores[i].screenReaderText)?"":__t)+'</span>\n            <span class="wpseo-score-text">'+(null==(__t=scores[i].text)?"":__t)+"</span>\n        </li>\n    ";__p+="\n</ul>\n"}return __p},templates.snippetEditor=function(obj){obj||(obj={});var __p="",__e=_.escape;Array.prototype.join;with(obj)__p+='<div id="snippet_preview">\n    <h3 class="snippet-editor__heading snippet-editor__heading-icon-eye">'+__e(i18n.snippetPreview)+'</h3>\n\n    <section class="snippet-editor__preview">\n        <div class="snippet_container snippet-editor__container" id="title_container">\n            <span class="title" id="snippet_title">\n                '+__e(rendered.title)+'\n            </span>\n            <span class="title" id="snippet_sitename"></span>\n        </div>\n        <div class="snippet_container snippet-editor__container" id="url_container">\n            <cite class="url urlBase" id="snippet_citeBase">\n                '+__e(rendered.baseUrl)+'\n            </cite>\n            <cite class="url" id="snippet_cite">\n                '+__e(rendered.snippetCite)+'\n            </cite>\n        </div>\n        <div class="snippet_container snippet-editor__container" id="meta_container">\n            ',""!==metaDescriptionDate&&(__p+='\n                <span class="snippet-editor__date">\n                    '+__e(metaDescriptionDate)+" -\n                </span>\n            "),__p+='\n            <span class="desc" id="snippet_meta">\n                '+__e(rendered.meta)+'\n            </span>\n        </div>\n\n        <button class="snippet-editor__button snippet-editor__edit-button" type="button" aria-expanded="false">\n            '+__e(i18n.edit)+'\n        </button>\n    </section>\n\n    <div class="snippet-editor__form snippet-editor--hidden">\n        <label for="snippet-editor-title" class="snippet-editor__label">\n            '+__e(i18n.title)+'\n            <input type="text" class="snippet-editor__input snippet-editor__title js-snippet-editor-title" id="snippet-editor-title" value="'+__e(raw.title)+'" placeholder="'+__e(placeholder.title)+'" />\n            <progress value="0.0" class="snippet-editor__progress snippet-editor__progress-title">\n                <div class="snippet-editor__progress-bar"></div>\n            </progress>\n        </label>\n        <label for="snippet-editor-slug" class="snippet-editor__label">\n            '+__e(i18n.slug)+'\n            <input type="text" class="snippet-editor__input snippet-editor__slug js-snippet-editor-slug" id="snippet-editor-slug" value="'+__e(raw.snippetCite)+'" placeholder="'+__e(placeholder.urlPath)+'" />\n        </label>\n        <label for="snippet-editor-meta-description" class="snippet-editor__label">\n            '+__e(i18n.metaDescription)+'\n            <textarea class="snippet-editor__input snippet-editor__meta-description js-snippet-editor-meta-description" id="snippet-editor-meta-description" placeholder="'+__e(placeholder.metaDesc)+'">'+__e(raw.meta)+'</textarea>\n            <progress value="0.0" class="snippet-editor__progress snippet-editor__progress-meta-description">\n                <div class="snippet-editor__progress-bar"></div>\n            </progress>\n        </label>\n\n        <button class="snippet-editor__submit snippet-editor__button" type="button">'+__e(i18n.save)+"</button>\n    </div>\n</div>\n";return __p},freeModule?((freeModule.exports=templates).templates=templates,freeExports.templates=templates):root.templates=templates}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],81:[function(a,b,c){var d=a("lodash/isUndefined"),e=a("lodash/isNumber"),f=function(){this._hasScore=!1,this.score=0,this.text=""};f.prototype.hasScore=function(){return this._hasScore},f.prototype.getScore=function(){return this.score},f.prototype.setScore=function(a){e(a)&&(this.score=a,this._hasScore=!0)},f.prototype.hasText=function(){return""!==this.text},f.prototype.getText=function(){return this.text},f.prototype.setText=function(a){d(a)&&(a=""),this.text=a},b.exports=f},{"lodash/isNumber":244,"lodash/isUndefined":251}],82:[function(a,b,c){var d=a("lodash/defaults"),e=a("../stringProcessing/sanitizeString.js"),f={keyword:"",description:"",title:"",url:"",locale:"en_US"},g=function(a){return a.keyword=e(a.keyword),a},h=function(a,b){this._text=a||"",b=b||{},d(b,f),this._attributes=g(b)};h.prototype.hasKeyword=function(){return""!==this._attributes.keyword},h.prototype.getKeyword=function(){return this._attributes.keyword},h.prototype.hasText=function(){return""!==this._text},h.prototype.getText=function(){return this._text},h.prototype.hasDescription=function(){return""!==this._attributes.description},h.prototype.getDescription=function(){return this._attributes.description},h.prototype.hasTitle=function(){return""!==this._attributes.title},h.prototype.getTitle=function(){return this._attributes.title},h.prototype.hasUrl=function(){return""!==this._attributes.url},h.prototype.getUrl=function(){return this._attributes.url},h.prototype.hasLocale=function(){return""!==this._attributes.locale},h.prototype.getLocale=function(){return this._attributes.locale},b.exports=h},{"../stringProcessing/sanitizeString.js":72,"lodash/defaults":226}],83:[function(a,b,c){"function"==typeof Object.create?b.exports=function(a,b){a.super_=b,a.prototype=Object.create(b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}})}:b.exports=function(a,b){a.super_=b;var c=function(){};c.prototype=b.prototype,a.prototype=new c,a.prototype.constructor=a}},{}],84:[function(a,b,c){function d(){m&&h&&(m=!1,h.length?l=h.concat(l):n=-1,l.length&&e())}function e(){if(!m){var a=j(d);m=!0;for(var b=l.length;b;){for(h=l,l=[];++n<b;)h&&h[n].run();n=-1,b=l.length}h=null,m=!1,k(a)}}function f(a,b){this.fun=a,this.array=b}function g(){}var h,i=b.exports={},j=setTimeout,k=clearTimeout,l=[],m=!1,n=-1;i.nextTick=function(a){var b=new Array(arguments.length-1);if(arguments.length>1)for(var c=1;c<arguments.length;c++)b[c-1]=arguments[c];l.push(new f(a,b)),1!==l.length||m||j(e,0)},f.prototype.run=function(){this.fun.apply(null,this.array)},i.title="browser",i.browser=!0,i.env={},i.argv=[],i.version="",i.versions={},i.on=g,i.addListener=g,i.once=g,i.off=g,i.removeListener=g,i.removeAllListeners=g,i.emit=g,i.binding=function(a){throw new Error("process.binding is not supported")},i.cwd=function(){return"/"},i.chdir=function(a){throw new Error("process.chdir is not supported")},i.umask=function(){return 0}},{}],85:[function(a,b,c){b.exports=function(a){return a&&"object"==typeof a&&"function"==typeof a.copy&&"function"==typeof a.fill&&"function"==typeof a.readUInt8}},{}],86:[function(a,b,c){(function(b,d){function e(a,b){var d={seen:[],stylize:g};return arguments.length>=3&&(d.depth=arguments[2]),arguments.length>=4&&(d.colors=arguments[3]),p(b)?d.showHidden=b:b&&c._extend(d,b),v(d.showHidden)&&(d.showHidden=!1),v(d.depth)&&(d.depth=2),v(d.colors)&&(d.colors=!1),v(d.customInspect)&&(d.customInspect=!0),d.colors&&(d.stylize=f),i(d,a,d.depth)}function f(a,b){var c=e.styles[b];return c?"["+e.colors[c][0]+"m"+a+"["+e.colors[c][1]+"m":a}function g(a,b){return a}function h(a){var b={};return a.forEach(function(a,c){b[a]=!0}),b}function i(a,b,d){if(a.customInspect&&b&&A(b.inspect)&&b.inspect!==c.inspect&&(!b.constructor||b.constructor.prototype!==b)){var e=b.inspect(d,a);return t(e)||(e=i(a,e,d)),e}var f=j(a,b);if(f)return f;var g=Object.keys(b),p=h(g);if(a.showHidden&&(g=Object.getOwnPropertyNames(b)),z(b)&&(g.indexOf("message")>=0||g.indexOf("description")>=0))return k(b);if(0===g.length){if(A(b)){var q=b.name?": "+b.name:"";return a.stylize("[Function"+q+"]","special")}if(w(b))return a.stylize(RegExp.prototype.toString.call(b),"regexp");if(y(b))return a.stylize(Date.prototype.toString.call(b),"date");if(z(b))return k(b)}var r="",s=!1,u=["{","}"];if(o(b)&&(s=!0,u=["[","]"]),A(b)){var v=b.name?": "+b.name:"";r=" [Function"+v+"]"}if(w(b)&&(r=" "+RegExp.prototype.toString.call(b)),y(b)&&(r=" "+Date.prototype.toUTCString.call(b)),z(b)&&(r=" "+k(b)),0===g.length&&(!s||0==b.length))return u[0]+r+u[1];if(0>d)return w(b)?a.stylize(RegExp.prototype.toString.call(b),"regexp"):a.stylize("[Object]","special");a.seen.push(b);var x;return x=s?l(a,b,d,p,g):g.map(function(c){return m(a,b,d,p,c,s)}),a.seen.pop(),n(x,r,u)}function j(a,b){if(v(b))return a.stylize("undefined","undefined");if(t(b)){var c="'"+JSON.stringify(b).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return a.stylize(c,"string")}return s(b)?a.stylize(""+b,"number"):p(b)?a.stylize(""+b,"boolean"):q(b)?a.stylize("null","null"):void 0}function k(a){return"["+Error.prototype.toString.call(a)+"]"}function l(a,b,c,d,e){for(var f=[],g=0,h=b.length;h>g;++g)F(b,String(g))?f.push(m(a,b,c,d,String(g),!0)):f.push("");return e.forEach(function(e){e.match(/^\d+$/)||f.push(m(a,b,c,d,e,!0))}),f}function m(a,b,c,d,e,f){var g,h,j;if(j=Object.getOwnPropertyDescriptor(b,e)||{value:b[e]},j.get?h=j.set?a.stylize("[Getter/Setter]","special"):a.stylize("[Getter]","special"):j.set&&(h=a.stylize("[Setter]","special")),F(d,e)||(g="["+e+"]"),h||(a.seen.indexOf(j.value)<0?(h=q(c)?i(a,j.value,null):i(a,j.value,c-1),h.indexOf("\n")>-1&&(h=f?h.split("\n").map(function(a){return"  "+a}).join("\n").substr(2):"\n"+h.split("\n").map(function(a){return"   "+a}).join("\n"))):h=a.stylize("[Circular]","special")),v(g)){if(f&&e.match(/^\d+$/))return h;g=JSON.stringify(""+e),g.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(g=g.substr(1,g.length-2),g=a.stylize(g,"name")):(g=g.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),g=a.stylize(g,"string"))}return g+": "+h}function n(a,b,c){var d=0,e=a.reduce(function(a,b){return d++,b.indexOf("\n")>=0&&d++,a+b.replace(/\u001b\[\d\d?m/g,"").length+1},0);return e>60?c[0]+(""===b?"":b+"\n ")+" "+a.join(",\n  ")+" "+c[1]:c[0]+b+" "+a.join(", ")+" "+c[1]}function o(a){return Array.isArray(a)}function p(a){return"boolean"==typeof a}function q(a){return null===a}function r(a){return null==a}function s(a){return"number"==typeof a}function t(a){return"string"==typeof a}function u(a){return"symbol"==typeof a}function v(a){return void 0===a}function w(a){return x(a)&&"[object RegExp]"===C(a)}function x(a){return"object"==typeof a&&null!==a}function y(a){return x(a)&&"[object Date]"===C(a)}function z(a){return x(a)&&("[object Error]"===C(a)||a instanceof Error)}function A(a){return"function"==typeof a}function B(a){return null===a||"boolean"==typeof a||"number"==typeof a||"string"==typeof a||"symbol"==typeof a||"undefined"==typeof a}function C(a){return Object.prototype.toString.call(a)}function D(a){return 10>a?"0"+a.toString(10):a.toString(10)}function E(){var a=new Date,b=[D(a.getHours()),D(a.getMinutes()),D(a.getSeconds())].join(":");return[a.getDate(),J[a.getMonth()],b].join(" ")}function F(a,b){return Object.prototype.hasOwnProperty.call(a,b)}var G=/%[sdj%]/g;c.format=function(a){if(!t(a)){for(var b=[],c=0;c<arguments.length;c++)b.push(e(arguments[c]));return b.join(" ")}for(var c=1,d=arguments,f=d.length,g=String(a).replace(G,function(a){if("%%"===a)return"%";if(c>=f)return a;switch(a){case"%s":return String(d[c++]);case"%d":return Number(d[c++]);case"%j":try{return JSON.stringify(d[c++])}catch(b){return"[Circular]"}default:return a}}),h=d[c];f>c;h=d[++c])g+=q(h)||!x(h)?" "+h:" "+e(h);return g},c.deprecate=function(a,e){function f(){if(!g){if(b.throwDeprecation)throw new Error(e);b.traceDeprecation?console.trace(e):console.error(e),g=!0}return a.apply(this,arguments)}if(v(d.process))return function(){return c.deprecate(a,e).apply(this,arguments)};if(b.noDeprecation===!0)return a;var g=!1;return f};var H,I={};c.debuglog=function(a){if(v(H)&&(H=b.env.NODE_DEBUG||""),a=a.toUpperCase(),!I[a])if(new RegExp("\\b"+a+"\\b","i").test(H)){var d=b.pid;I[a]=function(){var b=c.format.apply(c,arguments);console.error("%s %d: %s",a,d,b)}}else I[a]=function(){};return I[a]},c.inspect=e,e.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]},e.styles={special:"cyan",number:"yellow","boolean":"yellow",undefined:"grey","null":"bold",string:"green",date:"magenta",regexp:"red"},c.isArray=o,c.isBoolean=p,c.isNull=q,c.isNullOrUndefined=r,c.isNumber=s,c.isString=t,c.isSymbol=u,c.isUndefined=v,c.isRegExp=w,c.isObject=x,c.isDate=y,c.isError=z,c.isFunction=A,c.isPrimitive=B,c.isBuffer=a("./support/isBuffer");var J=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];c.log=function(){console.log("%s - %s",E(),c.format.apply(c,arguments))},c.inherits=a("inherits"),c._extend=function(a,b){if(!b||!x(b))return a;for(var c=Object.keys(b),d=c.length;d--;)a[c[d]]=b[c[d]];return a}}).call(this,a("_process"),"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./support/isBuffer":85,_process:84,inherits:83}],87:[function(a,b,c){!function(a,d){function e(a){return n.PF.compile(a||"nplurals=2; plural=(n != 1);")}function f(a,b){this._key=a,this._i18n=b}var g=Array.prototype,h=Object.prototype,i=g.slice,j=h.hasOwnProperty,k=g.forEach,l={},m={forEach:function(a,b,c){var d,e,f;if(null!==a)if(k&&a.forEach===k)a.forEach(b,c);else if(a.length===+a.length){for(d=0,e=a.length;e>d;d++)if(d in a&&b.call(c,a[d],d,a)===l)return}else for(f in a)if(j.call(a,f)&&b.call(c,a[f],f,a)===l)return},extend:function(a){return this.forEach(i.call(arguments,1),function(b){for(var c in b)a[c]=b[c]}),a}},n=function(a){if(this.defaults={locale_data:{messages:{"":{domain:"messages",lang:"en",plural_forms:"nplurals=2; plural=(n != 1);"}}},domain:"messages",debug:!1},this.options=m.extend({},this.defaults,a),this.textdomain(this.options.domain),a.domain&&!this.options.locale_data[this.options.domain])throw new Error("Text domain set to non-existent domain: `"+a.domain+"`")};n.context_delimiter=String.fromCharCode(4),m.extend(f.prototype,{onDomain:function(a){return this._domain=a,this},withContext:function(a){return this._context=a,this},ifPlural:function(a,b){return this._val=a,this._pkey=b,this},fetch:function(a){return"[object Array]"!={}.toString.call(a)&&(a=[].slice.call(arguments,0)),(a&&a.length?n.sprintf:function(a){return a})(this._i18n.dcnpgettext(this._domain,this._context,this._key,this._pkey,this._val),a)}}),m.extend(n.prototype,{translate:function(a){return new f(a,this)},textdomain:function(a){return a?void(this._textdomain=a):this._textdomain},gettext:function(a){return this.dcnpgettext.call(this,d,d,a)},dgettext:function(a,b){return this.dcnpgettext.call(this,a,d,b)},dcgettext:function(a,b){return this.dcnpgettext.call(this,a,d,b)},ngettext:function(a,b,c){return this.dcnpgettext.call(this,d,d,a,b,c)},dngettext:function(a,b,c,e){return this.dcnpgettext.call(this,a,d,b,c,e)},dcngettext:function(a,b,c,e){return this.dcnpgettext.call(this,a,d,b,c,e)},pgettext:function(a,b){return this.dcnpgettext.call(this,d,a,b)},dpgettext:function(a,b,c){return this.dcnpgettext.call(this,a,b,c)},dcpgettext:function(a,b,c){return this.dcnpgettext.call(this,a,b,c)},npgettext:function(a,b,c,e){return this.dcnpgettext.call(this,d,a,b,c,e)},dnpgettext:function(a,b,c,d,e){return this.dcnpgettext.call(this,a,b,c,d,e)},dcnpgettext:function(a,b,c,d,f){d=d||c,a=a||this._textdomain;var g;if(!this.options)return g=new n,g.dcnpgettext.call(g,void 0,void 0,c,d,f);if(!this.options.locale_data)throw new Error("No locale data provided.");if(!this.options.locale_data[a])throw new Error("Domain `"+a+"` was not found.");if(!this.options.locale_data[a][""])throw new Error("No locale meta information provided.");if(!c)throw new Error("No translation key found.");var h,i,j,k=b?b+n.context_delimiter+c:c,l=this.options.locale_data,m=l[a],o=(l.messages||this.defaults.locale_data.messages)[""],p=m[""].plural_forms||m[""]["Plural-Forms"]||m[""]["plural-forms"]||o.plural_forms||o["Plural-Forms"]||o["plural-forms"];if(void 0===f)j=0;else{if("number"!=typeof f&&(f=parseInt(f,10),isNaN(f)))throw new Error("The number that was passed in is not a number.");j=e(p)(f)}if(!m)throw new Error("No domain named `"+a+"` could be found.");return h=m[k],!h||j>h.length?(this.options.missing_key_callback&&this.options.missing_key_callback(k,a),i=[c,d],this.options.debug===!0&&console.log(i[e(p)(f)]),i[e()(f)]):(i=h[j],i?i:(i=[c,d],i[e()(f)]))}});var o=function(){function a(a){return Object.prototype.toString.call(a).slice(8,-1).toLowerCase()}function b(a,b){for(var c=[];b>0;c[--b]=a);return c.join("")}var c=function(){return c.cache.hasOwnProperty(arguments[0])||(c.cache[arguments[0]]=c.parse(arguments[0])),c.format.call(null,c.cache[arguments[0]],arguments)};return c.format=function(c,d){var e,f,g,h,i,j,k,l=1,m=c.length,n="",p=[];for(f=0;m>f;f++)if(n=a(c[f]),"string"===n)p.push(c[f]);else if("array"===n){if(h=c[f],h[2])for(e=d[l],g=0;g<h[2].length;g++){if(!e.hasOwnProperty(h[2][g]))throw o('[sprintf] property "%s" does not exist',h[2][g]);e=e[h[2][g]]}else e=h[1]?d[h[1]]:d[l++];if(/[^s]/.test(h[8])&&"number"!=a(e))throw o("[sprintf] expecting number but found %s",a(e));switch("undefined"!=typeof e&&null!==e||(e=""),h[8]){case"b":e=e.toString(2);break;case"c":e=String.fromCharCode(e);break;case"d":e=parseInt(e,10);break;case"e":e=h[7]?e.toExponential(h[7]):e.toExponential();break;case"f":e=h[7]?parseFloat(e).toFixed(h[7]):parseFloat(e);break;case"o":e=e.toString(8);break;case"s":e=(e=String(e))&&h[7]?e.substring(0,h[7]):e;break;case"u":e=Math.abs(e);break;case"x":e=e.toString(16);break;case"X":e=e.toString(16).toUpperCase()}e=/[def]/.test(h[8])&&h[3]&&e>=0?"+"+e:e,j=h[4]?"0"==h[4]?"0":h[4].charAt(1):" ",k=h[6]-String(e).length,i=h[6]?b(j,k):"",p.push(h[5]?e+i:i+e)}return p.join("")},c.cache={},c.parse=function(a){for(var b=a,c=[],d=[],e=0;b;){if(null!==(c=/^[^\x25]+/.exec(b)))d.push(c[0]);else if(null!==(c=/^\x25{2}/.exec(b)))d.push("%");else{if(null===(c=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(b)))throw"[sprintf] huh?";if(c[2]){e|=1;var f=[],g=c[2],h=[];if(null===(h=/^([a-z_][a-z_\d]*)/i.exec(g)))throw"[sprintf] huh?";for(f.push(h[1]);""!==(g=g.substring(h[0].length));)if(null!==(h=/^\.([a-z_][a-z_\d]*)/i.exec(g)))f.push(h[1]);else{if(null===(h=/^\[(\d+)\]/.exec(g)))throw"[sprintf] huh?";f.push(h[1])}c[2]=f}else e|=2;if(3===e)throw"[sprintf] mixing positional and named placeholders is not (yet) supported";d.push(c)}b=b.substring(c[0].length)}return d},c}(),p=function(a,b){return b.unshift(a),o.apply(null,b)};n.parse_plural=function(a,b){return a=a.replace(/n/g,b),n.parse_expression(a)},n.sprintf=function(a,b){return"[object Array]"=={}.toString.call(b)?p(a,[].slice.call(b)):o.apply(this,[].slice.call(arguments))},n.prototype.sprintf=function(){return n.sprintf.apply(this,arguments)},n.PF={},n.PF.parse=function(a){var b=n.PF.extractPluralExpr(a);return n.PF.parser.parse.call(n.PF.parser,b)},n.PF.compile=function(a){function b(a){return a===!0?1:a?a:0}var c=n.PF.parse(a);return function(a){return b(n.PF.interpreter(c)(a))}},n.PF.interpreter=function(a){return function(b){switch(a.type){case"GROUP":return n.PF.interpreter(a.expr)(b);case"TERNARY":return n.PF.interpreter(a.expr)(b)?n.PF.interpreter(a.truthy)(b):n.PF.interpreter(a.falsey)(b);case"OR":return n.PF.interpreter(a.left)(b)||n.PF.interpreter(a.right)(b);case"AND":return n.PF.interpreter(a.left)(b)&&n.PF.interpreter(a.right)(b);case"LT":return n.PF.interpreter(a.left)(b)<n.PF.interpreter(a.right)(b);case"GT":return n.PF.interpreter(a.left)(b)>n.PF.interpreter(a.right)(b);case"LTE":return n.PF.interpreter(a.left)(b)<=n.PF.interpreter(a.right)(b);case"GTE":return n.PF.interpreter(a.left)(b)>=n.PF.interpreter(a.right)(b);case"EQ":return n.PF.interpreter(a.left)(b)==n.PF.interpreter(a.right)(b);case"NEQ":return n.PF.interpreter(a.left)(b)!=n.PF.interpreter(a.right)(b);case"MOD":return n.PF.interpreter(a.left)(b)%n.PF.interpreter(a.right)(b);case"VAR":return b;case"NUM":return a.val;default:throw new Error("Invalid Token found.")}}},n.PF.extractPluralExpr=function(a){a=a.replace(/^\s\s*/,"").replace(/\s\s*$/,""),/;\s*$/.test(a)||(a=a.concat(";"));var b,c=/nplurals\=(\d+);/,d=/plural\=(.*);/,e=a.match(c),f={};if(!(e.length>1))throw new Error("nplurals not found in plural_forms string: "+a);if(f.nplurals=e[1],a=a.replace(c,""),b=a.match(d),!(b&&b.length>1))throw new Error("`plural` expression not found: "+a);return b[1]},n.PF.parser=function(){var a={trace:function(){},yy:{},symbols_:{error:2,expressions:3,e:4,EOF:5,"?":6,":":7,"||":8,"&&":9,"<":10,"<=":11,">":12,">=":13,"!=":14,"==":15,"%":16,"(":17,")":18,n:19,NUMBER:20,$accept:0,$end:1},terminals_:{2:"error",5:"EOF",6:"?",7:":",8:"||",9:"&&",10:"<",11:"<=",12:">",13:">=",14:"!=",15:"==",16:"%",17:"(",18:")",19:"n",20:"NUMBER"},productions_:[0,[3,2],[4,5],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,1],[4,1]],performAction:function(a,b,c,d,e,f,g){var h=f.length-1;switch(e){case 1:return{type:"GROUP",expr:f[h-1]};case 2:this.$={type:"TERNARY",expr:f[h-4],truthy:f[h-2],falsey:f[h]};break;case 3:this.$={type:"OR",left:f[h-2],right:f[h]};break;case 4:this.$={type:"AND",left:f[h-2],right:f[h]};break;case 5:this.$={type:"LT",left:f[h-2],right:f[h]};break;case 6:this.$={type:"LTE",left:f[h-2],right:f[h]};break;case 7:this.$={type:"GT",left:f[h-2],right:f[h]};break;case 8:this.$={type:"GTE",left:f[h-2],right:f[h]};break;case 9:this.$={type:"NEQ",left:f[h-2],right:f[h]};break;case 10:this.$={type:"EQ",left:f[h-2],right:f[h]};break;case 11:this.$={type:"MOD",left:f[h-2],right:f[h]};break;case 12:this.$={type:"GROUP",expr:f[h-1]};break;case 13:this.$={type:"VAR"};break;case 14:this.$={type:"NUM",val:Number(a)}}},table:[{3:1,4:2,17:[1,3],19:[1,4],20:[1,5]},{1:[3]},{5:[1,6],6:[1,7],8:[1,8],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16]},{4:17,17:[1,3],19:[1,4],20:[1,5]},{5:[2,13],6:[2,13],7:[2,13],8:[2,13],9:[2,13],10:[2,13],11:[2,13],12:[2,13],13:[2,13],14:[2,13],15:[2,13],16:[2,13],18:[2,13]},{5:[2,14],6:[2,14],7:[2,14],8:[2,14],9:[2,14],10:[2,14],11:[2,14],12:[2,14],13:[2,14],14:[2,14],15:[2,14],16:[2,14],18:[2,14]},{1:[2,1]},{4:18,17:[1,3],19:[1,4],20:[1,5]},{4:19,17:[1,3],19:[1,4],20:[1,5]},{4:20,17:[1,3],19:[1,4],20:[1,5]},{4:21,17:[1,3],19:[1,4],20:[1,5]},{4:22,17:[1,3],19:[1,4],20:[1,5]},{4:23,17:[1,3],19:[1,4],20:[1,5]},{4:24,17:[1,3],19:[1,4],20:[1,5]},{4:25,17:[1,3],19:[1,4],20:[1,5]},{4:26,17:[1,3],19:[1,4],20:[1,5]},{4:27,17:[1,3],19:[1,4],20:[1,5]},{6:[1,7],8:[1,8],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16],18:[1,28]},{6:[1,7],7:[1,29],8:[1,8],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16]},{5:[2,3],6:[2,3],7:[2,3],8:[2,3],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],
  14:[1,14],15:[1,15],16:[1,16],18:[2,3]},{5:[2,4],6:[2,4],7:[2,4],8:[2,4],9:[2,4],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16],18:[2,4]},{5:[2,5],6:[2,5],7:[2,5],8:[2,5],9:[2,5],10:[2,5],11:[2,5],12:[2,5],13:[2,5],14:[2,5],15:[2,5],16:[1,16],18:[2,5]},{5:[2,6],6:[2,6],7:[2,6],8:[2,6],9:[2,6],10:[2,6],11:[2,6],12:[2,6],13:[2,6],14:[2,6],15:[2,6],16:[1,16],18:[2,6]},{5:[2,7],6:[2,7],7:[2,7],8:[2,7],9:[2,7],10:[2,7],11:[2,7],12:[2,7],13:[2,7],14:[2,7],15:[2,7],16:[1,16],18:[2,7]},{5:[2,8],6:[2,8],7:[2,8],8:[2,8],9:[2,8],10:[2,8],11:[2,8],12:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[1,16],18:[2,8]},{5:[2,9],6:[2,9],7:[2,9],8:[2,9],9:[2,9],10:[2,9],11:[2,9],12:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[1,16],18:[2,9]},{5:[2,10],6:[2,10],7:[2,10],8:[2,10],9:[2,10],10:[2,10],11:[2,10],12:[2,10],13:[2,10],14:[2,10],15:[2,10],16:[1,16],18:[2,10]},{5:[2,11],6:[2,11],7:[2,11],8:[2,11],9:[2,11],10:[2,11],11:[2,11],12:[2,11],13:[2,11],14:[2,11],15:[2,11],16:[2,11],18:[2,11]},{5:[2,12],6:[2,12],7:[2,12],8:[2,12],9:[2,12],10:[2,12],11:[2,12],12:[2,12],13:[2,12],14:[2,12],15:[2,12],16:[2,12],18:[2,12]},{4:30,17:[1,3],19:[1,4],20:[1,5]},{5:[2,2],6:[1,7],7:[2,2],8:[1,8],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16],18:[2,2]}],defaultActions:{6:[2,1]},parseError:function(a,b){throw new Error(a)},parse:function(a){function b(a){e.length=e.length-2*a,f.length=f.length-a,g.length=g.length-a}function c(){var a;return a=d.lexer.lex()||1,"number"!=typeof a&&(a=d.symbols_[a]||a),a}var d=this,e=[0],f=[null],g=[],h=this.table,i="",j=0,k=0,l=0,m=2,n=1;this.lexer.setInput(a),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,"undefined"==typeof this.lexer.yylloc&&(this.lexer.yylloc={});var o=this.lexer.yylloc;g.push(o),"function"==typeof this.yy.parseError&&(this.parseError=this.yy.parseError);for(var p,q,r,s,t,u,v,w,x,y={};;){if(r=e[e.length-1],this.defaultActions[r]?s=this.defaultActions[r]:(null==p&&(p=c()),s=h[r]&&h[r][p]),"undefined"==typeof s||!s.length||!s[0]){if(!l){x=[];for(u in h[r])this.terminals_[u]&&u>2&&x.push("'"+this.terminals_[u]+"'");var z="";z=this.lexer.showPosition?"Parse error on line "+(j+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+x.join(", ")+", got '"+this.terminals_[p]+"'":"Parse error on line "+(j+1)+": Unexpected "+(1==p?"end of input":"'"+(this.terminals_[p]||p)+"'"),this.parseError(z,{text:this.lexer.match,token:this.terminals_[p]||p,line:this.lexer.yylineno,loc:o,expected:x})}if(3==l){if(p==n)throw new Error(z||"Parsing halted.");k=this.lexer.yyleng,i=this.lexer.yytext,j=this.lexer.yylineno,o=this.lexer.yylloc,p=c()}for(;;){if(m.toString()in h[r])break;if(0==r)throw new Error(z||"Parsing halted.");b(1),r=e[e.length-1]}q=p,p=m,r=e[e.length-1],s=h[r]&&h[r][m],l=3}if(s[0]instanceof Array&&s.length>1)throw new Error("Parse Error: multiple actions possible at state: "+r+", token: "+p);switch(s[0]){case 1:e.push(p),f.push(this.lexer.yytext),g.push(this.lexer.yylloc),e.push(s[1]),p=null,q?(p=q,q=null):(k=this.lexer.yyleng,i=this.lexer.yytext,j=this.lexer.yylineno,o=this.lexer.yylloc,l>0&&l--);break;case 2:if(v=this.productions_[s[1]][1],y.$=f[f.length-v],y._$={first_line:g[g.length-(v||1)].first_line,last_line:g[g.length-1].last_line,first_column:g[g.length-(v||1)].first_column,last_column:g[g.length-1].last_column},t=this.performAction.call(y,i,k,j,this.yy,s[1],f,g),"undefined"!=typeof t)return t;v&&(e=e.slice(0,-1*v*2),f=f.slice(0,-1*v),g=g.slice(0,-1*v)),e.push(this.productions_[s[1]][0]),f.push(y.$),g.push(y._$),w=h[e[e.length-2]][e[e.length-1]],e.push(w);break;case 3:return!0}}return!0}},b=function(){var a={EOF:1,parseError:function(a,b){if(!this.yy.parseError)throw new Error(a);this.yy.parseError(a,b)},setInput:function(a){return this._input=a,this._more=this._less=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this},input:function(){var a=this._input[0];this.yytext+=a,this.yyleng++,this.match+=a,this.matched+=a;var b=a.match(/\n/);return b&&this.yylineno++,this._input=this._input.slice(1),a},unput:function(a){return this._input=a+this._input,this},more:function(){return this._more=!0,this},pastInput:function(){var a=this.matched.substr(0,this.matched.length-this.match.length);return(a.length>20?"...":"")+a.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var a=this.match;return a.length<20&&(a+=this._input.substr(0,20-a.length)),(a.substr(0,20)+(a.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var a=this.pastInput(),b=new Array(a.length+1).join("-");return a+this.upcomingInput()+"\n"+b+"^"},next:function(){if(this.done)return this.EOF;this._input||(this.done=!0);var a,b,c;this._more||(this.yytext="",this.match="");for(var d=this._currentRules(),e=0;e<d.length;e++)if(b=this._input.match(this.rules[d[e]]))return c=b[0].match(/\n.*/g),c&&(this.yylineno+=c.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:c?c[c.length-1].length-1:this.yylloc.last_column+b[0].length},this.yytext+=b[0],this.match+=b[0],this.matches=b,this.yyleng=this.yytext.length,this._more=!1,this._input=this._input.slice(b[0].length),this.matched+=b[0],a=this.performAction.call(this,this.yy,this,d[e],this.conditionStack[this.conditionStack.length-1]),a?a:void 0;return""===this._input?this.EOF:void this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){var a=this.next();return"undefined"!=typeof a?a:this.lex()},begin:function(a){this.conditionStack.push(a)},popState:function(){return this.conditionStack.pop()},_currentRules:function(){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules},topState:function(){return this.conditionStack[this.conditionStack.length-2]},pushState:function(a){this.begin(a)}};return a.performAction=function(a,b,c,d){switch(c){case 0:break;case 1:return 20;case 2:return 19;case 3:return 8;case 4:return 9;case 5:return 6;case 6:return 7;case 7:return 11;case 8:return 13;case 9:return 10;case 10:return 12;case 11:return 14;case 12:return 15;case 13:return 16;case 14:return 17;case 15:return 18;case 16:return 5;case 17:return"INVALID"}},a.rules=[/^\s+/,/^[0-9]+(\.[0-9]+)?\b/,/^n\b/,/^\|\|/,/^&&/,/^\?/,/^:/,/^<=/,/^>=/,/^</,/^>/,/^!=/,/^==/,/^%/,/^\(/,/^\)/,/^$/,/^./],a.conditions={INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],inclusive:!0}},a}();return a.lexer=b,a}(),"undefined"!=typeof c?("undefined"!=typeof b&&b.exports&&(c=b.exports=n),c.Jed=n):("function"==typeof define&&define.amd&&define("jed",function(){return n}),a.Jed=n)}(this)},{}],88:[function(a,b,c){var d=a("./_getNative"),e=a("./_root"),f=d(e,"DataView");b.exports=f},{"./_getNative":171,"./_root":211}],89:[function(a,b,c){function d(a){var b=-1,c=a?a.length:0;for(this.clear();++b<c;){var d=a[b];this.set(d[0],d[1])}}var e=a("./_hashClear"),f=a("./_hashDelete"),g=a("./_hashGet"),h=a("./_hashHas"),i=a("./_hashSet");d.prototype.clear=e,d.prototype["delete"]=f,d.prototype.get=g,d.prototype.has=h,d.prototype.set=i,b.exports=d},{"./_hashClear":177,"./_hashDelete":178,"./_hashGet":179,"./_hashHas":180,"./_hashSet":181}],90:[function(a,b,c){function d(a){var b=-1,c=a?a.length:0;for(this.clear();++b<c;){var d=a[b];this.set(d[0],d[1])}}var e=a("./_listCacheClear"),f=a("./_listCacheDelete"),g=a("./_listCacheGet"),h=a("./_listCacheHas"),i=a("./_listCacheSet");d.prototype.clear=e,d.prototype["delete"]=f,d.prototype.get=g,d.prototype.has=h,d.prototype.set=i,b.exports=d},{"./_listCacheClear":197,"./_listCacheDelete":198,"./_listCacheGet":199,"./_listCacheHas":200,"./_listCacheSet":201}],91:[function(a,b,c){var d=a("./_getNative"),e=a("./_root"),f=d(e,"Map");b.exports=f},{"./_getNative":171,"./_root":211}],92:[function(a,b,c){function d(a){var b=-1,c=a?a.length:0;for(this.clear();++b<c;){var d=a[b];this.set(d[0],d[1])}}var e=a("./_mapCacheClear"),f=a("./_mapCacheDelete"),g=a("./_mapCacheGet"),h=a("./_mapCacheHas"),i=a("./_mapCacheSet");d.prototype.clear=e,d.prototype["delete"]=f,d.prototype.get=g,d.prototype.has=h,d.prototype.set=i,b.exports=d},{"./_mapCacheClear":202,"./_mapCacheDelete":203,"./_mapCacheGet":204,"./_mapCacheHas":205,"./_mapCacheSet":206}],93:[function(a,b,c){var d=a("./_getNative"),e=a("./_root"),f=d(e,"Promise");b.exports=f},{"./_getNative":171,"./_root":211}],94:[function(a,b,c){var d=a("./_root"),e=d.Reflect;b.exports=e},{"./_root":211}],95:[function(a,b,c){var d=a("./_getNative"),e=a("./_root"),f=d(e,"Set");b.exports=f},{"./_getNative":171,"./_root":211}],96:[function(a,b,c){function d(a){var b=-1,c=a?a.length:0;for(this.__data__=new e;++b<c;)this.add(a[b])}var e=a("./_MapCache"),f=a("./_setCacheAdd"),g=a("./_setCacheHas");d.prototype.add=d.prototype.push=f,d.prototype.has=g,b.exports=d},{"./_MapCache":92,"./_setCacheAdd":212,"./_setCacheHas":213}],97:[function(a,b,c){function d(a){this.__data__=new e(a)}var e=a("./_ListCache"),f=a("./_stackClear"),g=a("./_stackDelete"),h=a("./_stackGet"),i=a("./_stackHas"),j=a("./_stackSet");d.prototype.clear=f,d.prototype["delete"]=g,d.prototype.get=h,d.prototype.has=i,d.prototype.set=j,b.exports=d},{"./_ListCache":90,"./_stackClear":215,"./_stackDelete":216,"./_stackGet":217,"./_stackHas":218,"./_stackSet":219}],98:[function(a,b,c){var d=a("./_root"),e=d.Symbol;b.exports=e},{"./_root":211}],99:[function(a,b,c){var d=a("./_root"),e=d.Uint8Array;b.exports=e},{"./_root":211}],100:[function(a,b,c){var d=a("./_getNative"),e=a("./_root"),f=d(e,"WeakMap");b.exports=f},{"./_getNative":171,"./_root":211}],101:[function(a,b,c){function d(a,b){return a.set(b[0],b[1]),a}b.exports=d},{}],102:[function(a,b,c){function d(a,b){return a.add(b),a}b.exports=d},{}],103:[function(a,b,c){function d(a,b,c){var d=c.length;switch(d){case 0:return a.call(b);case 1:return a.call(b,c[0]);case 2:return a.call(b,c[0],c[1]);case 3:return a.call(b,c[0],c[1],c[2])}return a.apply(b,c)}b.exports=d},{}],104:[function(a,b,c){function d(a,b){for(var c=-1,d=a?a.length:0;++c<d&&b(a[c],c,a)!==!1;);return a}b.exports=d},{}],105:[function(a,b,c){function d(a,b){var c=a?a.length:0;return!!c&&e(a,b,0)>-1}var e=a("./_baseIndexOf");b.exports=d},{"./_baseIndexOf":128}],106:[function(a,b,c){function d(a,b,c){for(var d=-1,e=a?a.length:0;++d<e;)if(c(b,a[d]))return!0;return!1}b.exports=d},{}],107:[function(a,b,c){function d(a,b){for(var c=-1,d=a?a.length:0,e=Array(d);++c<d;)e[c]=b(a[c],c,a);return e}b.exports=d},{}],108:[function(a,b,c){function d(a,b){for(var c=-1,d=b.length,e=a.length;++c<d;)a[e+c]=b[c];return a}b.exports=d},{}],109:[function(a,b,c){function d(a,b,c,d){var e=-1,f=a?a.length:0;for(d&&f&&(c=a[++e]);++e<f;)c=b(c,a[e],e,a);return c}b.exports=d},{}],110:[function(a,b,c){function d(a,b){for(var c=-1,d=a?a.length:0;++c<d;)if(b(a[c],c,a))return!0;return!1}b.exports=d},{}],111:[function(a,b,c){function d(a,b,c,d){return void 0===a||e(a,f[c])&&!g.call(d,c)?b:a}var e=a("./eq"),f=Object.prototype,g=f.hasOwnProperty;b.exports=d},{"./eq":229}],112:[function(a,b,c){function d(a,b,c){(void 0===c||e(a[b],c))&&("number"!=typeof b||void 0!==c||b in a)||(a[b]=c)}var e=a("./eq");b.exports=d},{"./eq":229}],113:[function(a,b,c){function d(a,b,c){var d=a[b];g.call(a,b)&&e(d,c)&&(void 0!==c||b in a)||(a[b]=c)}var e=a("./eq"),f=Object.prototype,g=f.hasOwnProperty;b.exports=d},{"./eq":229}],114:[function(a,b,c){function d(a,b){for(var c=a.length;c--;)if(e(a[c][0],b))return c;return-1}var e=a("./eq");b.exports=d},{"./eq":229}],115:[function(a,b,c){function d(a,b){return a&&e(b,f(b),a)}var e=a("./_copyObject"),f=a("./keys");b.exports=d},{"./_copyObject":158,"./keys":252}],116:[function(a,b,c){function d(a,b,c,w,x,y,z){var C;if(w&&(C=y?w(a,x,y,z):w(a)),void 0!==C)return C;if(!t(a))return a;var D=q(a);if(D){if(C=n(a),!b)return j(a,C)}else{var F=m(a),G=F==A||F==B;if(r(a))return i(a,b);if(F==E||F==v||G&&!y){if(s(a))return y?a:{};if(C=p(G?{}:a),!b)return k(a,h(C,a))}else{if(!V[F])return y?a:{};C=o(a,F,d,b)}}z||(z=new e);var H=z.get(a);if(H)return H;if(z.set(a,C),!D)var I=c?l(a):u(a);return f(I||a,function(e,f){I&&(f=e,e=a[f]),g(C,f,d(e,b,c,w,f,a,z))}),C}var e=a("./_Stack"),f=a("./_arrayEach"),g=a("./_assignValue"),h=a("./_baseAssign"),i=a("./_cloneBuffer"),j=a("./_copyArray"),k=a("./_copySymbols"),l=a("./_getAllKeys"),m=a("./_getTag"),n=a("./_initCloneArray"),o=a("./_initCloneByTag"),p=a("./_initCloneObject"),q=a("./isArray"),r=a("./isBuffer"),s=a("./_isHostObject"),t=a("./isObject"),u=a("./keys"),v="[object Arguments]",w="[object Array]",x="[object Boolean]",y="[object Date]",z="[object Error]",A="[object Function]",B="[object GeneratorFunction]",C="[object Map]",D="[object Number]",E="[object Object]",F="[object RegExp]",G="[object Set]",H="[object String]",I="[object Symbol]",J="[object WeakMap]",K="[object ArrayBuffer]",L="[object DataView]",M="[object Float32Array]",N="[object Float64Array]",O="[object Int8Array]",P="[object Int16Array]",Q="[object Int32Array]",R="[object Uint8Array]",S="[object Uint8ClampedArray]",T="[object Uint16Array]",U="[object Uint32Array]",V={};V[v]=V[w]=V[K]=V[L]=V[x]=V[y]=V[M]=V[N]=V[O]=V[P]=V[Q]=V[C]=V[D]=V[E]=V[F]=V[G]=V[H]=V[I]=V[R]=V[S]=V[T]=V[U]=!0,V[z]=V[A]=V[J]=!1,b.exports=d},{"./_Stack":97,"./_arrayEach":104,"./_assignValue":113,"./_baseAssign":115,"./_cloneBuffer":150,"./_copyArray":157,"./_copySymbols":159,"./_getAllKeys":167,"./_getTag":174,"./_initCloneArray":184,"./_initCloneByTag":185,"./_initCloneObject":186,"./_isHostObject":188,"./isArray":236,"./isBuffer":239,"./isObject":245,"./keys":252}],117:[function(a,b,c){function d(a){return e(a)?f(a):{}}var e=a("./isObject"),f=Object.create;b.exports=d},{"./isObject":245}],118:[function(a,b,c){function d(a,b,c,d){var l=-1,m=f,n=!0,o=a.length,p=[],q=b.length;if(!o)return p;c&&(b=h(b,i(c))),d?(m=g,n=!1):b.length>=k&&(m=j,n=!1,b=new e(b));a:for(;++l<o;){var r=a[l],s=c?c(r):r;if(r=d||0!==r?r:0,n&&s===s){for(var t=q;t--;)if(b[t]===s)continue a;p.push(r)}else m(b,s,d)||p.push(r)}return p}var e=a("./_SetCache"),f=a("./_arrayIncludes"),g=a("./_arrayIncludesWith"),h=a("./_arrayMap"),i=a("./_baseUnary"),j=a("./_cacheHas"),k=200;b.exports=d},{"./_SetCache":96,"./_arrayIncludes":105,"./_arrayIncludesWith":106,"./_arrayMap":107,"./_baseUnary":145,"./_cacheHas":146}],119:[function(a,b,c){var d=a("./_baseForOwn"),e=a("./_createBaseEach"),f=e(d);b.exports=f},{"./_baseForOwn":122,"./_createBaseEach":162}],120:[function(a,b,c){function d(a,b,c,g,h){var i=-1,j=a.length;for(c||(c=f),h||(h=[]);++i<j;){var k=a[i];b>0&&c(k)?b>1?d(k,b-1,c,g,h):e(h,k):g||(h[h.length]=k)}return h}var e=a("./_arrayPush"),f=a("./_isFlattenable");b.exports=d},{"./_arrayPush":108,"./_isFlattenable":187}],121:[function(a,b,c){var d=a("./_createBaseFor"),e=d();b.exports=e},{"./_createBaseFor":163}],122:[function(a,b,c){function d(a,b){return a&&e(a,b,f)}var e=a("./_baseFor"),f=a("./keys");b.exports=d},{"./_baseFor":121,"./keys":252}],123:[function(a,b,c){function d(a,b){b=f(b,a)?[b]:e(b);for(var c=0,d=b.length;null!=a&&d>c;)a=a[g(b[c++])];return c&&c==d?a:void 0}var e=a("./_castPath"),f=a("./_isKey"),g=a("./_toKey");b.exports=d},{"./_castPath":147,"./_isKey":191,"./_toKey":221}],124:[function(a,b,c){function d(a,b,c){var d=b(a);return f(a)?d:e(d,c(a))}var e=a("./_arrayPush"),f=a("./isArray");b.exports=d},{"./_arrayPush":108,"./isArray":236}],125:[function(a,b,c){function d(a,b){return null!=a&&(g.call(a,b)||"object"==typeof a&&b in a&&null===e(a))}var e=a("./_getPrototype"),f=Object.prototype,g=f.hasOwnProperty;b.exports=d},{"./_getPrototype":172}],126:[function(a,b,c){function d(a,b){return null!=a&&b in Object(a)}b.exports=d},{}],127:[function(a,b,c){function d(a,b,c){return a>=f(b,c)&&a<e(b,c)}var e=Math.max,f=Math.min;b.exports=d},{}],128:[function(a,b,c){function d(a,b,c){if(b!==b)return e(a,c);for(var d=c-1,f=a.length;++d<f;)if(a[d]===b)return d;return-1}var e=a("./_indexOfNaN");b.exports=d},{"./_indexOfNaN":183}],129:[function(a,b,c){function d(a,b,c,h,i){return a===b?!0:null==a||null==b||!f(a)&&!g(b)?a!==a&&b!==b:e(a,b,d,c,h,i)}var e=a("./_baseIsEqualDeep"),f=a("./isObject"),g=a("./isObjectLike");b.exports=d},{"./_baseIsEqualDeep":130,"./isObject":245,"./isObjectLike":246}],130:[function(a,b,c){function d(a,b,c,d,q,s){var t=j(a),u=j(b),v=o,w=o;t||(v=i(a),v=v==n?p:v),u||(w=i(b),w=w==n?p:w);var x=v==p&&!k(a),y=w==p&&!k(b),z=v==w;if(z&&!x)return s||(s=new e),t||l(a)?f(a,b,c,d,q,s):g(a,b,v,c,d,q,s);if(!(q&m)){var A=x&&r.call(a,"__wrapped__"),B=y&&r.call(b,"__wrapped__");if(A||B){var C=A?a.value():a,D=B?b.value():b;return s||(s=new e),c(C,D,d,q,s)}}return z?(s||(s=new e),h(a,b,c,d,q,s)):!1}var e=a("./_Stack"),f=a("./_equalArrays"),g=a("./_equalByTag"),h=a("./_equalObjects"),i=a("./_getTag"),j=a("./isArray"),k=a("./_isHostObject"),l=a("./isTypedArray"),m=2,n="[object Arguments]",o="[object Array]",p="[object Object]",q=Object.prototype,r=q.hasOwnProperty;b.exports=d},{"./_Stack":97,"./_equalArrays":164,"./_equalByTag":165,"./_equalObjects":166,"./_getTag":174,"./_isHostObject":188,"./isArray":236,"./isTypedArray":250}],131:[function(a,b,c){function d(a,b,c,d){var i=c.length,j=i,k=!d;if(null==a)return!j;for(a=Object(a);i--;){var l=c[i];if(k&&l[2]?l[1]!==a[l[0]]:!(l[0]in a))return!1}for(;++i<j;){l=c[i];var m=l[0],n=a[m],o=l[1];if(k&&l[2]){if(void 0===n&&!(m in a))return!1}else{var p=new e;if(d)var q=d(n,o,m,a,b,p);if(!(void 0===q?f(o,n,d,g|h,p):q))return!1}}return!0}var e=a("./_Stack"),f=a("./_baseIsEqual"),g=1,h=2;b.exports=d},{"./_Stack":97,"./_baseIsEqual":129}],132:[function(a,b,c){function d(a){if(!h(a)||g(a))return!1;var b=e(a)||f(a)?o:k;return b.test(i(a))}var e=a("./isFunction"),f=a("./_isHostObject"),g=a("./_isMasked"),h=a("./isObject"),i=a("./_toSource"),j=/[\\^$.*+?()[\]{}|]/g,k=/^\[object .+?Constructor\]$/,l=Object.prototype,m=Function.prototype.toString,n=l.hasOwnProperty,o=RegExp("^"+m.call(n).replace(j,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");b.exports=d},{"./_isHostObject":188,"./_isMasked":193,"./_toSource":222,"./isFunction":242,"./isObject":245}],133:[function(a,b,c){function d(a){return"function"==typeof a?a:null==a?g:"object"==typeof a?h(a)?f(a[0],a[1]):e(a):i(a)}var e=a("./_baseMatches"),f=a("./_baseMatchesProperty"),g=a("./identity"),h=a("./isArray"),i=a("./property");b.exports=d},{"./_baseMatches":136,"./_baseMatchesProperty":137,"./identity":233,"./isArray":236,"./property":258}],134:[function(a,b,c){function d(a){return e(Object(a))}var e=Object.keys;b.exports=d},{}],135:[function(a,b,c){function d(a){a=null==a?a:Object(a);var b=[];for(var c in a)b.push(c);return b}var e=a("./_Reflect"),f=a("./_iteratorToArray"),g=Object.prototype,h=e?e.enumerate:void 0,i=g.propertyIsEnumerable;h&&!i.call({valueOf:1},"valueOf")&&(d=function(a){return f(h(a))}),b.exports=d},{"./_Reflect":94,"./_iteratorToArray":196}],136:[function(a,b,c){function d(a){var b=f(a);return 1==b.length&&b[0][2]?g(b[0][0],b[0][1]):function(c){return c===a||e(c,a,b)}}var e=a("./_baseIsMatch"),f=a("./_getMatchData"),g=a("./_matchesStrictComparable");b.exports=d},{"./_baseIsMatch":131,"./_getMatchData":170,"./_matchesStrictComparable":208}],137:[function(a,b,c){function d(a,b){return h(a)&&i(b)?j(k(a),b):function(c){var d=f(c,a);return void 0===d&&d===b?g(c,a):e(b,d,void 0,l|m)}}var e=a("./_baseIsEqual"),f=a("./get"),g=a("./hasIn"),h=a("./_isKey"),i=a("./_isStrictComparable"),j=a("./_matchesStrictComparable"),k=a("./_toKey"),l=1,m=2;b.exports=d},{"./_baseIsEqual":129,"./_isKey":191,"./_isStrictComparable":195,"./_matchesStrictComparable":208,"./_toKey":221,"./get":231,"./hasIn":232}],138:[function(a,b,c){function d(a,b,c,m,n){if(a!==b){if(!i(b)&&!k(b))var o=l(b);f(o||b,function(f,i){if(o&&(i=f,f=b[i]),j(f))n||(n=new e),h(a,b,i,c,d,m,n);else{var k=m?m(a[i],f,i+"",a,b,n):void 0;void 0===k&&(k=f),g(a,i,k)}})}}var e=a("./_Stack"),f=a("./_arrayEach"),g=a("./_assignMergeValue"),h=a("./_baseMergeDeep"),i=a("./isArray"),j=a("./isObject"),k=a("./isTypedArray"),l=a("./keysIn");b.exports=d},{"./_Stack":97,"./_arrayEach":104,"./_assignMergeValue":112,"./_baseMergeDeep":139,"./isArray":236,"./isObject":245,"./isTypedArray":250,"./keysIn":253}],139:[function(a,b,c){function d(a,b,c,d,p,q,r){var s=a[c],t=b[c],u=r.get(t);if(u)return void e(a,c,u);var v=q?q(s,t,c+"",a,b,r):void 0,w=void 0===v;w&&(v=t,i(t)||n(t)?i(s)?v=s:j(s)?v=g(s):(w=!1,v=f(t,!0)):m(t)||h(t)?h(s)?v=o(s):!l(s)||d&&k(s)?(w=!1,v=f(t,!0)):v=s:w=!1),r.set(t,v),w&&p(v,t,d,q,r),r["delete"](t),e(a,c,v)}var e=a("./_assignMergeValue"),f=a("./_baseClone"),g=a("./_copyArray"),h=a("./isArguments"),i=a("./isArray"),j=a("./isArrayLikeObject"),k=a("./isFunction"),l=a("./isObject"),m=a("./isPlainObject"),n=a("./isTypedArray"),o=a("./toPlainObject");b.exports=d},{"./_assignMergeValue":112,"./_baseClone":116,"./_copyArray":157,"./isArguments":235,"./isArray":236,"./isArrayLikeObject":238,"./isFunction":242,"./isObject":245,"./isPlainObject":247,"./isTypedArray":250,"./toPlainObject":266}],140:[function(a,b,c){function d(a){return function(b){return null==b?void 0:b[a]}}b.exports=d},{}],141:[function(a,b,c){function d(a){return function(b){return e(b,a)}}var e=a("./_baseGet");b.exports=d},{"./_baseGet":123}],142:[function(a,b,c){function d(a,b,c,d,e){return e(a,function(a,e,f){c=d?(d=!1,a):b(c,a,e,f)}),c}b.exports=d},{}],143:[function(a,b,c){function d(a,b){for(var c=-1,d=Array(a);++c<a;)d[c]=b(c);return d}b.exports=d},{}],144:[function(a,b,c){function d(a){if("string"==typeof a)return a;if(f(a))return i?i.call(a):"";var b=a+"";return"0"==b&&1/a==-g?"-0":b}var e=a("./_Symbol"),f=a("./isSymbol"),g=1/0,h=e?e.prototype:void 0,i=h?h.toString:void 0;b.exports=d},{"./_Symbol":98,"./isSymbol":249}],145:[function(a,b,c){function d(a){return function(b){return a(b)}}b.exports=d},{}],146:[function(a,b,c){function d(a,b){return a.has(b)}b.exports=d},{}],147:[function(a,b,c){function d(a){return e(a)?a:f(a)}var e=a("./isArray"),f=a("./_stringToPath");b.exports=d},{"./_stringToPath":220,"./isArray":236}],148:[function(a,b,c){function d(a){return a&&a.Object===Object?a:null}b.exports=d},{}],149:[function(a,b,c){function d(a){var b=new a.constructor(a.byteLength);return new e(b).set(new e(a)),b}var e=a("./_Uint8Array");b.exports=d},{"./_Uint8Array":99}],150:[function(a,b,c){function d(a,b){if(b)return a.slice();var c=new a.constructor(a.length);return a.copy(c),c}b.exports=d},{}],151:[function(a,b,c){function d(a,b){var c=b?e(a.buffer):a.buffer;return new a.constructor(c,a.byteOffset,a.byteLength)}var e=a("./_cloneArrayBuffer");b.exports=d},{"./_cloneArrayBuffer":149}],152:[function(a,b,c){function d(a,b,c){var d=b?c(g(a),!0):g(a);return f(d,e,new a.constructor)}var e=a("./_addMapEntry"),f=a("./_arrayReduce"),g=a("./_mapToArray");b.exports=d},{"./_addMapEntry":101,"./_arrayReduce":109,"./_mapToArray":207}],153:[function(a,b,c){function d(a){var b=new a.constructor(a.source,e.exec(a));return b.lastIndex=a.lastIndex,b}var e=/\w*$/;b.exports=d},{}],154:[function(a,b,c){function d(a,b,c){var d=b?c(g(a),!0):g(a);return f(d,e,new a.constructor)}var e=a("./_addSetEntry"),f=a("./_arrayReduce"),g=a("./_setToArray");b.exports=d},{"./_addSetEntry":102,"./_arrayReduce":109,"./_setToArray":214}],155:[function(a,b,c){function d(a){return g?Object(g.call(a)):{}}var e=a("./_Symbol"),f=e?e.prototype:void 0,g=f?f.valueOf:void 0;b.exports=d},{"./_Symbol":98}],156:[function(a,b,c){function d(a,b){var c=b?e(a.buffer):a.buffer;return new a.constructor(c,a.byteOffset,a.length)}var e=a("./_cloneArrayBuffer");b.exports=d},{"./_cloneArrayBuffer":149}],157:[function(a,b,c){function d(a,b){var c=-1,d=a.length;for(b||(b=Array(d));++c<d;)b[c]=a[c];return b}b.exports=d},{}],158:[function(a,b,c){function d(a,b,c,d){c||(c={});for(var f=-1,g=b.length;++f<g;){var h=b[f],i=d?d(c[h],a[h],h,c,a):a[h];e(c,h,i)}return c}var e=a("./_assignValue");b.exports=d},{"./_assignValue":113}],159:[function(a,b,c){function d(a,b){return e(a,f(a),b)}var e=a("./_copyObject"),f=a("./_getSymbols");b.exports=d},{"./_copyObject":158,"./_getSymbols":173}],160:[function(a,b,c){var d=a("./_root"),e=d["__core-js_shared__"];b.exports=e},{"./_root":211}],161:[function(a,b,c){function d(a){return f(function(b,c){var d=-1,f=c.length,g=f>1?c[f-1]:void 0,h=f>2?c[2]:void 0;for(g=a.length>3&&"function"==typeof g?(f--,g):void 0,h&&e(c[0],c[1],h)&&(g=3>f?void 0:g,f=1),b=Object(b);++d<f;){var i=c[d];i&&a(b,i,d,g)}return b})}var e=a("./_isIterateeCall"),f=a("./rest");b.exports=d},{"./_isIterateeCall":190,"./rest":260}],162:[function(a,b,c){function d(a,b){return function(c,d){if(null==c)return c;if(!e(c))return a(c,d);for(var f=c.length,g=b?f:-1,h=Object(c);(b?g--:++g<f)&&d(h[g],g,h)!==!1;);return c}}var e=a("./isArrayLike");b.exports=d},{"./isArrayLike":237}],163:[function(a,b,c){function d(a){return function(b,c,d){for(var e=-1,f=Object(b),g=d(b),h=g.length;h--;){var i=g[a?h:++e];if(c(f[i],i,f)===!1)break}return b}}b.exports=d},{}],164:[function(a,b,c){function d(a,b,c,d,i,j){var k=i&h,l=a.length,m=b.length;if(l!=m&&!(k&&m>l))return!1;var n=j.get(a);if(n)return n==b;var o=-1,p=!0,q=i&g?new e:void 0;for(j.set(a,b);++o<l;){var r=a[o],s=b[o];if(d)var t=k?d(s,r,o,b,a,j):d(r,s,o,a,b,j);if(void 0!==t){if(t)continue;p=!1;break}if(q){if(!f(b,function(a,b){return q.has(b)||r!==a&&!c(r,a,d,i,j)?void 0:q.add(b)})){p=!1;break}}else if(r!==s&&!c(r,s,d,i,j)){p=!1;break}}return j["delete"](a),p}var e=a("./_SetCache"),f=a("./_arraySome"),g=1,h=2;b.exports=d},{"./_SetCache":96,"./_arraySome":110}],165:[function(a,b,c){function d(a,b,c,d,e,w,y){switch(c){case v:if(a.byteLength!=b.byteLength||a.byteOffset!=b.byteOffset)return!1;a=a.buffer,b=b.buffer;case u:return!(a.byteLength!=b.byteLength||!d(new f(a),new f(b)));case l:case m:return+a==+b;case n:return a.name==b.name&&a.message==b.message;case p:return a!=+a?b!=+b:a==+b;case q:case s:return a==b+"";case o:var z=h;case r:var A=w&k;if(z||(z=i),a.size!=b.size&&!A)return!1;var B=y.get(a);return B?B==b:(w|=j,y.set(a,b),g(z(a),z(b),d,e,w,y));case t:if(x)return x.call(a)==x.call(b)}return!1}var e=a("./_Symbol"),f=a("./_Uint8Array"),g=a("./_equalArrays"),h=a("./_mapToArray"),i=a("./_setToArray"),j=1,k=2,l="[object Boolean]",m="[object Date]",n="[object Error]",o="[object Map]",p="[object Number]",q="[object RegExp]",r="[object Set]",s="[object String]",t="[object Symbol]",u="[object ArrayBuffer]",v="[object DataView]",w=e?e.prototype:void 0,x=w?w.valueOf:void 0;b.exports=d},{"./_Symbol":98,"./_Uint8Array":99,"./_equalArrays":164,"./_mapToArray":207,"./_setToArray":214}],166:[function(a,b,c){function d(a,b,c,d,h,i){var j=h&g,k=f(a),l=k.length,m=f(b),n=m.length;if(l!=n&&!j)return!1;for(var o=l;o--;){var p=k[o];if(!(j?p in b:e(b,p)))return!1}var q=i.get(a);if(q)return q==b;var r=!0;i.set(a,b);for(var s=j;++o<l;){p=k[o];var t=a[p],u=b[p];if(d)var v=j?d(u,t,p,b,a,i):d(t,u,p,a,b,i);if(!(void 0===v?t===u||c(t,u,d,h,i):v)){r=!1;break}s||(s="constructor"==p)}if(r&&!s){var w=a.constructor,x=b.constructor;w!=x&&"constructor"in a&&"constructor"in b&&!("function"==typeof w&&w instanceof w&&"function"==typeof x&&x instanceof x)&&(r=!1)}return i["delete"](a),r}var e=a("./_baseHas"),f=a("./keys"),g=2;b.exports=d},{"./_baseHas":125,"./keys":252}],167:[function(a,b,c){function d(a){return e(a,g,f)}var e=a("./_baseGetAllKeys"),f=a("./_getSymbols"),g=a("./keys");b.exports=d},{"./_baseGetAllKeys":124,"./_getSymbols":173,"./keys":252}],168:[function(a,b,c){var d=a("./_baseProperty"),e=d("length");b.exports=e},{"./_baseProperty":140}],169:[function(a,b,c){function d(a,b){var c=a.__data__;return e(b)?c["string"==typeof b?"string":"hash"]:c.map}var e=a("./_isKeyable");b.exports=d},{"./_isKeyable":192}],170:[function(a,b,c){function d(a){for(var b=f(a),c=b.length;c--;){var d=b[c],g=a[d];b[c]=[d,g,e(g)]}return b}var e=a("./_isStrictComparable"),f=a("./keys");b.exports=d},{"./_isStrictComparable":195,"./keys":252}],171:[function(a,b,c){function d(a,b){var c=f(a,b);return e(c)?c:void 0}var e=a("./_baseIsNative"),f=a("./_getValue");b.exports=d},{"./_baseIsNative":132,"./_getValue":175}],172:[function(a,b,c){function d(a){return e(Object(a))}var e=Object.getPrototypeOf;b.exports=d},{}],173:[function(a,b,c){function d(a){return f(Object(a))}var e=a("./stubArray"),f=Object.getOwnPropertySymbols;f||(d=e),b.exports=d},{"./stubArray":261}],174:[function(a,b,c){function d(a){return r.call(a)}var e=a("./_DataView"),f=a("./_Map"),g=a("./_Promise"),h=a("./_Set"),i=a("./_WeakMap"),j=a("./_toSource"),k="[object Map]",l="[object Object]",m="[object Promise]",n="[object Set]",o="[object WeakMap]",p="[object DataView]",q=Object.prototype,r=q.toString,s=j(e),t=j(f),u=j(g),v=j(h),w=j(i);(e&&d(new e(new ArrayBuffer(1)))!=p||f&&d(new f)!=k||g&&d(g.resolve())!=m||h&&d(new h)!=n||i&&d(new i)!=o)&&(d=function(a){var b=r.call(a),c=b==l?a.constructor:void 0,d=c?j(c):void 0;if(d)switch(d){case s:return p;case t:return k;case u:return m;case v:return n;case w:return o}return b}),b.exports=d},{"./_DataView":88,"./_Map":91,"./_Promise":93,"./_Set":95,"./_WeakMap":100,"./_toSource":222}],175:[function(a,b,c){function d(a,b){return null==a?void 0:a[b]}b.exports=d},{}],176:[function(a,b,c){function d(a,b,c){b=i(b,a)?[b]:e(b);for(var d,m=-1,n=b.length;++m<n;){var o=l(b[m]);if(!(d=null!=a&&c(a,o)))break;a=a[o]}if(d)return d;var n=a?a.length:0;return!!n&&j(n)&&h(o,n)&&(g(a)||k(a)||f(a))}var e=a("./_castPath"),f=a("./isArguments"),g=a("./isArray"),h=a("./_isIndex"),i=a("./_isKey"),j=a("./isLength"),k=a("./isString"),l=a("./_toKey");b.exports=d},{"./_castPath":147,"./_isIndex":189,"./_isKey":191,"./_toKey":221,"./isArguments":235,"./isArray":236,"./isLength":243,"./isString":248}],177:[function(a,b,c){function d(){this.__data__=e?e(null):{}}var e=a("./_nativeCreate");b.exports=d},{"./_nativeCreate":210}],178:[function(a,b,c){function d(a){return this.has(a)&&delete this.__data__[a]}b.exports=d},{}],179:[function(a,b,c){function d(a){var b=this.__data__;if(e){var c=b[a];return c===f?void 0:c}return h.call(b,a)?b[a]:void 0}var e=a("./_nativeCreate"),f="__lodash_hash_undefined__",g=Object.prototype,h=g.hasOwnProperty;b.exports=d},{"./_nativeCreate":210}],180:[function(a,b,c){function d(a){var b=this.__data__;return e?void 0!==b[a]:g.call(b,a)}var e=a("./_nativeCreate"),f=Object.prototype,g=f.hasOwnProperty;b.exports=d},{"./_nativeCreate":210}],181:[function(a,b,c){function d(a,b){var c=this.__data__;return c[a]=e&&void 0===b?f:b,this}var e=a("./_nativeCreate"),f="__lodash_hash_undefined__";b.exports=d},{"./_nativeCreate":210}],182:[function(a,b,c){function d(a){var b=a?a.length:void 0;return h(b)&&(g(a)||i(a)||f(a))?e(b,String):null}var e=a("./_baseTimes"),f=a("./isArguments"),g=a("./isArray"),h=a("./isLength"),i=a("./isString");b.exports=d},{"./_baseTimes":143,"./isArguments":235,"./isArray":236,"./isLength":243,"./isString":248}],183:[function(a,b,c){function d(a,b,c){for(var d=a.length,e=b+(c?1:-1);c?e--:++e<d;){var f=a[e];if(f!==f)return e}return-1}b.exports=d},{}],184:[function(a,b,c){function d(a){var b=a.length,c=a.constructor(b);return b&&"string"==typeof a[0]&&f.call(a,"index")&&(c.index=a.index,c.input=a.input),c}var e=Object.prototype,f=e.hasOwnProperty;b.exports=d},{}],185:[function(a,b,c){function d(a,b,c,d){var E=a.constructor;switch(b){case t:return e(a);case l:case m:return new E(+a);case u:return f(a,d);case v:case w:case x:case y:case z:case A:case B:case C:case D:return k(a,d);case n:return g(a,d,c);case o:case r:return new E(a);case p:return h(a);case q:return i(a,d,c);case s:return j(a)}}var e=a("./_cloneArrayBuffer"),f=a("./_cloneDataView"),g=a("./_cloneMap"),h=a("./_cloneRegExp"),i=a("./_cloneSet"),j=a("./_cloneSymbol"),k=a("./_cloneTypedArray"),l="[object Boolean]",m="[object Date]",n="[object Map]",o="[object Number]",p="[object RegExp]",q="[object Set]",r="[object String]",s="[object Symbol]",t="[object ArrayBuffer]",u="[object DataView]",v="[object Float32Array]",w="[object Float64Array]",x="[object Int8Array]",y="[object Int16Array]",z="[object Int32Array]",A="[object Uint8Array]",B="[object Uint8ClampedArray]",C="[object Uint16Array]",D="[object Uint32Array]";
  b.exports=d},{"./_cloneArrayBuffer":149,"./_cloneDataView":151,"./_cloneMap":152,"./_cloneRegExp":153,"./_cloneSet":154,"./_cloneSymbol":155,"./_cloneTypedArray":156}],186:[function(a,b,c){function d(a){return"function"!=typeof a.constructor||g(a)?{}:e(f(a))}var e=a("./_baseCreate"),f=a("./_getPrototype"),g=a("./_isPrototype");b.exports=d},{"./_baseCreate":117,"./_getPrototype":172,"./_isPrototype":194}],187:[function(a,b,c){function d(a){return f(a)||e(a)}var e=a("./isArguments"),f=a("./isArray");b.exports=d},{"./isArguments":235,"./isArray":236}],188:[function(a,b,c){function d(a){var b=!1;if(null!=a&&"function"!=typeof a.toString)try{b=!!(a+"")}catch(c){}return b}b.exports=d},{}],189:[function(a,b,c){function d(a,b){return b=null==b?e:b,!!b&&("number"==typeof a||f.test(a))&&a>-1&&a%1==0&&b>a}var e=9007199254740991,f=/^(?:0|[1-9]\d*)$/;b.exports=d},{}],190:[function(a,b,c){function d(a,b,c){if(!h(c))return!1;var d=typeof b;return("number"==d?f(c)&&g(b,c.length):"string"==d&&b in c)?e(c[b],a):!1}var e=a("./eq"),f=a("./isArrayLike"),g=a("./_isIndex"),h=a("./isObject");b.exports=d},{"./_isIndex":189,"./eq":229,"./isArrayLike":237,"./isObject":245}],191:[function(a,b,c){function d(a,b){if(e(a))return!1;var c=typeof a;return"number"==c||"symbol"==c||"boolean"==c||null==a||f(a)?!0:h.test(a)||!g.test(a)||null!=b&&a in Object(b)}var e=a("./isArray"),f=a("./isSymbol"),g=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,h=/^\w*$/;b.exports=d},{"./isArray":236,"./isSymbol":249}],192:[function(a,b,c){function d(a){var b=typeof a;return"string"==b||"number"==b||"symbol"==b||"boolean"==b?"__proto__"!==a:null===a}b.exports=d},{}],193:[function(a,b,c){function d(a){return!!f&&f in a}var e=a("./_coreJsData"),f=function(){var a=/[^.]+$/.exec(e&&e.keys&&e.keys.IE_PROTO||"");return a?"Symbol(src)_1."+a:""}();b.exports=d},{"./_coreJsData":160}],194:[function(a,b,c){function d(a){var b=a&&a.constructor,c="function"==typeof b&&b.prototype||e;return a===c}var e=Object.prototype;b.exports=d},{}],195:[function(a,b,c){function d(a){return a===a&&!e(a)}var e=a("./isObject");b.exports=d},{"./isObject":245}],196:[function(a,b,c){function d(a){for(var b,c=[];!(b=a.next()).done;)c.push(b.value);return c}b.exports=d},{}],197:[function(a,b,c){function d(){this.__data__=[]}b.exports=d},{}],198:[function(a,b,c){function d(a){var b=this.__data__,c=e(b,a);if(0>c)return!1;var d=b.length-1;return c==d?b.pop():g.call(b,c,1),!0}var e=a("./_assocIndexOf"),f=Array.prototype,g=f.splice;b.exports=d},{"./_assocIndexOf":114}],199:[function(a,b,c){function d(a){var b=this.__data__,c=e(b,a);return 0>c?void 0:b[c][1]}var e=a("./_assocIndexOf");b.exports=d},{"./_assocIndexOf":114}],200:[function(a,b,c){function d(a){return e(this.__data__,a)>-1}var e=a("./_assocIndexOf");b.exports=d},{"./_assocIndexOf":114}],201:[function(a,b,c){function d(a,b){var c=this.__data__,d=e(c,a);return 0>d?c.push([a,b]):c[d][1]=b,this}var e=a("./_assocIndexOf");b.exports=d},{"./_assocIndexOf":114}],202:[function(a,b,c){function d(){this.__data__={hash:new e,map:new(g||f),string:new e}}var e=a("./_Hash"),f=a("./_ListCache"),g=a("./_Map");b.exports=d},{"./_Hash":89,"./_ListCache":90,"./_Map":91}],203:[function(a,b,c){function d(a){return e(this,a)["delete"](a)}var e=a("./_getMapData");b.exports=d},{"./_getMapData":169}],204:[function(a,b,c){function d(a){return e(this,a).get(a)}var e=a("./_getMapData");b.exports=d},{"./_getMapData":169}],205:[function(a,b,c){function d(a){return e(this,a).has(a)}var e=a("./_getMapData");b.exports=d},{"./_getMapData":169}],206:[function(a,b,c){function d(a,b){return e(this,a).set(a,b),this}var e=a("./_getMapData");b.exports=d},{"./_getMapData":169}],207:[function(a,b,c){function d(a){var b=-1,c=Array(a.size);return a.forEach(function(a,d){c[++b]=[d,a]}),c}b.exports=d},{}],208:[function(a,b,c){function d(a,b){return function(c){return null==c?!1:c[a]===b&&(void 0!==b||a in Object(c))}}b.exports=d},{}],209:[function(a,b,c){function d(a,b,c,g,h,i){return f(a)&&f(b)&&e(a,b,void 0,d,i.set(b,a)),a}var e=a("./_baseMerge"),f=a("./isObject");b.exports=d},{"./_baseMerge":138,"./isObject":245}],210:[function(a,b,c){var d=a("./_getNative"),e=d(Object,"create");b.exports=e},{"./_getNative":171}],211:[function(a,b,c){(function(c){var d=a("./_checkGlobal"),e=d("object"==typeof c&&c),f=d("object"==typeof self&&self),g=d("object"==typeof this&&this),h=e||f||g||Function("return this")();b.exports=h}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./_checkGlobal":148}],212:[function(a,b,c){function d(a){return this.__data__.set(a,e),this}var e="__lodash_hash_undefined__";b.exports=d},{}],213:[function(a,b,c){function d(a){return this.__data__.has(a)}b.exports=d},{}],214:[function(a,b,c){function d(a){var b=-1,c=Array(a.size);return a.forEach(function(a){c[++b]=a}),c}b.exports=d},{}],215:[function(a,b,c){function d(){this.__data__=new e}var e=a("./_ListCache");b.exports=d},{"./_ListCache":90}],216:[function(a,b,c){function d(a){return this.__data__["delete"](a)}b.exports=d},{}],217:[function(a,b,c){function d(a){return this.__data__.get(a)}b.exports=d},{}],218:[function(a,b,c){function d(a){return this.__data__.has(a)}b.exports=d},{}],219:[function(a,b,c){function d(a,b){var c=this.__data__;return c instanceof e&&c.__data__.length==g&&(c=this.__data__=new f(c.__data__)),c.set(a,b),this}var e=a("./_ListCache"),f=a("./_MapCache"),g=200;b.exports=d},{"./_ListCache":90,"./_MapCache":92}],220:[function(a,b,c){var d=a("./memoize"),e=a("./toString"),f=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g,g=/\\(\\)?/g,h=d(function(a){var b=[];return e(a).replace(f,function(a,c,d,e){b.push(d?e.replace(g,"$1"):c||a)}),b});b.exports=h},{"./memoize":254,"./toString":267}],221:[function(a,b,c){function d(a){if("string"==typeof a||e(a))return a;var b=a+"";return"0"==b&&1/a==-f?"-0":b}var e=a("./isSymbol"),f=1/0;b.exports=d},{"./isSymbol":249}],222:[function(a,b,c){function d(a){if(null!=a){try{return e.call(a)}catch(b){}try{return a+""}catch(b){}}return""}var e=Function.prototype.toString;b.exports=d},{}],223:[function(a,b,c){var d=a("./_copyObject"),e=a("./_createAssigner"),f=a("./keysIn"),g=e(function(a,b,c,e){d(b,f(b),a,e)});b.exports=g},{"./_copyObject":158,"./_createAssigner":161,"./keysIn":253}],224:[function(a,b,c){function d(a){return e(a,!1,!0)}var e=a("./_baseClone");b.exports=d},{"./_baseClone":116}],225:[function(a,b,c){function d(a,b,c){function d(b){var c=s,d=t;return s=t=void 0,y=b,v=a.apply(d,c)}function k(a){return y=a,w=setTimeout(n,b),z?d(a):v}function l(a){var c=a-x,d=a-y,e=b-c;return A?j(e,u-d):e}function m(a){var c=a-x,d=a-y;return void 0===x||c>=b||0>c||A&&d>=u}function n(){var a=f();return m(a)?o(a):void(w=setTimeout(n,l(a)))}function o(a){return w=void 0,B&&s?d(a):(s=t=void 0,v)}function p(){y=0,s=x=t=w=void 0}function q(){return void 0===w?v:o(f())}function r(){var a=f(),c=m(a);if(s=arguments,t=this,x=a,c){if(void 0===w)return k(x);if(A)return w=setTimeout(n,b),d(x)}return void 0===w&&(w=setTimeout(n,b)),v}var s,t,u,v,w,x,y=0,z=!1,A=!1,B=!0;if("function"!=typeof a)throw new TypeError(h);return b=g(b)||0,e(c)&&(z=!!c.leading,A="maxWait"in c,u=A?i(g(c.maxWait)||0,b):u,B="trailing"in c?!!c.trailing:B),r.cancel=p,r.flush=q,r}var e=a("./isObject"),f=a("./now"),g=a("./toNumber"),h="Expected a function",i=Math.max,j=Math.min;b.exports=d},{"./isObject":245,"./now":257,"./toNumber":265}],226:[function(a,b,c){var d=a("./_apply"),e=a("./_assignInDefaults"),f=a("./assignInWith"),g=a("./rest"),h=g(function(a){return a.push(void 0,e),d(f,void 0,a)});b.exports=h},{"./_apply":103,"./_assignInDefaults":111,"./assignInWith":223,"./rest":260}],227:[function(a,b,c){var d=a("./_apply"),e=a("./_mergeDefaults"),f=a("./mergeWith"),g=a("./rest"),h=g(function(a){return a.push(void 0,e),d(f,void 0,a)});b.exports=h},{"./_apply":103,"./_mergeDefaults":209,"./mergeWith":256,"./rest":260}],228:[function(a,b,c){var d=a("./_baseDifference"),e=a("./_baseFlatten"),f=a("./isArrayLikeObject"),g=a("./rest"),h=g(function(a,b){return f(a)?d(a,e(b,1,f,!0)):[]});b.exports=h},{"./_baseDifference":118,"./_baseFlatten":120,"./isArrayLikeObject":238,"./rest":260}],229:[function(a,b,c){function d(a,b){return a===b||a!==a&&b!==b}b.exports=d},{}],230:[function(a,b,c){function d(a,b){var c=h(a)?e:f;return c(a,g(b,3))}var e=a("./_arrayEach"),f=a("./_baseEach"),g=a("./_baseIteratee"),h=a("./isArray");b.exports=d},{"./_arrayEach":104,"./_baseEach":119,"./_baseIteratee":133,"./isArray":236}],231:[function(a,b,c){function d(a,b,c){var d=null==a?void 0:e(a,b);return void 0===d?c:d}var e=a("./_baseGet");b.exports=d},{"./_baseGet":123}],232:[function(a,b,c){function d(a,b){return null!=a&&f(a,b,e)}var e=a("./_baseHasIn"),f=a("./_hasPath");b.exports=d},{"./_baseHasIn":126,"./_hasPath":176}],233:[function(a,b,c){function d(a){return a}b.exports=d},{}],234:[function(a,b,c){function d(a,b,c){return b=f(b)||0,void 0===c?(c=b,b=0):c=f(c)||0,a=f(a),e(a,b,c)}var e=a("./_baseInRange"),f=a("./toNumber");b.exports=d},{"./_baseInRange":127,"./toNumber":265}],235:[function(a,b,c){function d(a){return e(a)&&h.call(a,"callee")&&(!j.call(a,"callee")||i.call(a)==f)}var e=a("./isArrayLikeObject"),f="[object Arguments]",g=Object.prototype,h=g.hasOwnProperty,i=g.toString,j=g.propertyIsEnumerable;b.exports=d},{"./isArrayLikeObject":238}],236:[function(a,b,c){var d=Array.isArray;b.exports=d},{}],237:[function(a,b,c){function d(a){return null!=a&&g(e(a))&&!f(a)}var e=a("./_getLength"),f=a("./isFunction"),g=a("./isLength");b.exports=d},{"./_getLength":168,"./isFunction":242,"./isLength":243}],238:[function(a,b,c){function d(a){return f(a)&&e(a)}var e=a("./isArrayLike"),f=a("./isObjectLike");b.exports=d},{"./isArrayLike":237,"./isObjectLike":246}],239:[function(a,b,c){var d=a("./_root"),e=a("./stubFalse"),f="object"==typeof c&&c,g=f&&"object"==typeof b&&b,h=g&&g.exports===f,i=h?d.Buffer:void 0,j=i?function(a){return a instanceof i}:e;b.exports=j},{"./_root":211,"./stubFalse":262}],240:[function(a,b,c){function d(a){return!!a&&1===a.nodeType&&e(a)&&!f(a)}var e=a("./isObjectLike"),f=a("./isPlainObject");b.exports=d},{"./isObjectLike":246,"./isPlainObject":247}],241:[function(a,b,c){function d(a){if(h(a)&&(g(a)||l(a)||j(a.splice)||f(a)||i(a)))return!a.length;if(k(a)){var b=e(a);if(b==n||b==o)return!a.size}for(var c in a)if(q.call(a,c))return!1;return!(s&&m(a).length)}var e=a("./_getTag"),f=a("./isArguments"),g=a("./isArray"),h=a("./isArrayLike"),i=a("./isBuffer"),j=a("./isFunction"),k=a("./isObjectLike"),l=a("./isString"),m=a("./keys"),n="[object Map]",o="[object Set]",p=Object.prototype,q=p.hasOwnProperty,r=p.propertyIsEnumerable,s=!r.call({valueOf:1},"valueOf");b.exports=d},{"./_getTag":174,"./isArguments":235,"./isArray":236,"./isArrayLike":237,"./isBuffer":239,"./isFunction":242,"./isObjectLike":246,"./isString":248,"./keys":252}],242:[function(a,b,c){function d(a){var b=e(a)?i.call(a):"";return b==f||b==g}var e=a("./isObject"),f="[object Function]",g="[object GeneratorFunction]",h=Object.prototype,i=h.toString;b.exports=d},{"./isObject":245}],243:[function(a,b,c){function d(a){return"number"==typeof a&&a>-1&&a%1==0&&e>=a}var e=9007199254740991;b.exports=d},{}],244:[function(a,b,c){function d(a){return"number"==typeof a||e(a)&&h.call(a)==f}var e=a("./isObjectLike"),f="[object Number]",g=Object.prototype,h=g.toString;b.exports=d},{"./isObjectLike":246}],245:[function(a,b,c){function d(a){var b=typeof a;return!!a&&("object"==b||"function"==b)}b.exports=d},{}],246:[function(a,b,c){function d(a){return!!a&&"object"==typeof a}b.exports=d},{}],247:[function(a,b,c){function d(a){if(!g(a)||m.call(a)!=h||f(a))return!1;var b=e(a);if(null===b)return!0;var c=k.call(b,"constructor")&&b.constructor;return"function"==typeof c&&c instanceof c&&j.call(c)==l}var e=a("./_getPrototype"),f=a("./_isHostObject"),g=a("./isObjectLike"),h="[object Object]",i=Object.prototype,j=Function.prototype.toString,k=i.hasOwnProperty,l=j.call(Object),m=i.toString;b.exports=d},{"./_getPrototype":172,"./_isHostObject":188,"./isObjectLike":246}],248:[function(a,b,c){function d(a){return"string"==typeof a||!e(a)&&f(a)&&i.call(a)==g}var e=a("./isArray"),f=a("./isObjectLike"),g="[object String]",h=Object.prototype,i=h.toString;b.exports=d},{"./isArray":236,"./isObjectLike":246}],249:[function(a,b,c){function d(a){return"symbol"==typeof a||e(a)&&h.call(a)==f}var e=a("./isObjectLike"),f="[object Symbol]",g=Object.prototype,h=g.toString;b.exports=d},{"./isObjectLike":246}],250:[function(a,b,c){function d(a){return f(a)&&e(a.length)&&!!E[G.call(a)]}var e=a("./isLength"),f=a("./isObjectLike"),g="[object Arguments]",h="[object Array]",i="[object Boolean]",j="[object Date]",k="[object Error]",l="[object Function]",m="[object Map]",n="[object Number]",o="[object Object]",p="[object RegExp]",q="[object Set]",r="[object String]",s="[object WeakMap]",t="[object ArrayBuffer]",u="[object DataView]",v="[object Float32Array]",w="[object Float64Array]",x="[object Int8Array]",y="[object Int16Array]",z="[object Int32Array]",A="[object Uint8Array]",B="[object Uint8ClampedArray]",C="[object Uint16Array]",D="[object Uint32Array]",E={};E[v]=E[w]=E[x]=E[y]=E[z]=E[A]=E[B]=E[C]=E[D]=!0,E[g]=E[h]=E[t]=E[i]=E[u]=E[j]=E[k]=E[l]=E[m]=E[n]=E[o]=E[p]=E[q]=E[r]=E[s]=!1;var F=Object.prototype,G=F.toString;b.exports=d},{"./isLength":243,"./isObjectLike":246}],251:[function(a,b,c){function d(a){return void 0===a}b.exports=d},{}],252:[function(a,b,c){function d(a){var b=j(a);if(!b&&!h(a))return f(a);var c=g(a),d=!!c,k=c||[],l=k.length;for(var m in a)!e(a,m)||d&&("length"==m||i(m,l))||b&&"constructor"==m||k.push(m);return k}var e=a("./_baseHas"),f=a("./_baseKeys"),g=a("./_indexKeys"),h=a("./isArrayLike"),i=a("./_isIndex"),j=a("./_isPrototype");b.exports=d},{"./_baseHas":125,"./_baseKeys":134,"./_indexKeys":182,"./_isIndex":189,"./_isPrototype":194,"./isArrayLike":237}],253:[function(a,b,c){function d(a){for(var b=-1,c=h(a),d=e(a),i=d.length,k=f(a),l=!!k,m=k||[],n=m.length;++b<i;){var o=d[b];l&&("length"==o||g(o,n))||"constructor"==o&&(c||!j.call(a,o))||m.push(o)}return m}var e=a("./_baseKeysIn"),f=a("./_indexKeys"),g=a("./_isIndex"),h=a("./_isPrototype"),i=Object.prototype,j=i.hasOwnProperty;b.exports=d},{"./_baseKeysIn":135,"./_indexKeys":182,"./_isIndex":189,"./_isPrototype":194}],254:[function(a,b,c){function d(a,b){if("function"!=typeof a||b&&"function"!=typeof b)throw new TypeError(f);var c=function(){var d=arguments,e=b?b.apply(this,d):d[0],f=c.cache;if(f.has(e))return f.get(e);var g=a.apply(this,d);return c.cache=f.set(e,g),g};return c.cache=new(d.Cache||e),c}var e=a("./_MapCache"),f="Expected a function";d.Cache=e,b.exports=d},{"./_MapCache":92}],255:[function(a,b,c){var d=a("./_baseMerge"),e=a("./_createAssigner"),f=e(function(a,b,c){d(a,b,c)});b.exports=f},{"./_baseMerge":138,"./_createAssigner":161}],256:[function(a,b,c){var d=a("./_baseMerge"),e=a("./_createAssigner"),f=e(function(a,b,c,e){d(a,b,c,e)});b.exports=f},{"./_baseMerge":138,"./_createAssigner":161}],257:[function(a,b,c){function d(){return Date.now()}b.exports=d},{}],258:[function(a,b,c){function d(a){return g(a)?e(h(a)):f(a)}var e=a("./_baseProperty"),f=a("./_basePropertyDeep"),g=a("./_isKey"),h=a("./_toKey");b.exports=d},{"./_baseProperty":140,"./_basePropertyDeep":141,"./_isKey":191,"./_toKey":221}],259:[function(a,b,c){function d(a,b,c){var d=i(a)?e:h,j=arguments.length<3;return d(a,g(b,4),c,j,f)}var e=a("./_arrayReduce"),f=a("./_baseEach"),g=a("./_baseIteratee"),h=a("./_baseReduce"),i=a("./isArray");b.exports=d},{"./_arrayReduce":109,"./_baseEach":119,"./_baseIteratee":133,"./_baseReduce":142,"./isArray":236}],260:[function(a,b,c){function d(a,b){if("function"!=typeof a)throw new TypeError(g);return b=h(void 0===b?a.length-1:f(b),0),function(){for(var c=arguments,d=-1,f=h(c.length-b,0),g=Array(f);++d<f;)g[d]=c[b+d];switch(b){case 0:return a.call(this,g);case 1:return a.call(this,c[0],g);case 2:return a.call(this,c[0],c[1],g)}var i=Array(b+1);for(d=-1;++d<b;)i[d]=c[d];return i[b]=g,e(a,this,i)}}var e=a("./_apply"),f=a("./toInteger"),g="Expected a function",h=Math.max;b.exports=d},{"./_apply":103,"./toInteger":264}],261:[function(a,b,c){function d(){return[]}b.exports=d},{}],262:[function(a,b,c){function d(){return!1}b.exports=d},{}],263:[function(a,b,c){function d(a){if(!a)return 0===a?a:0;if(a=e(a),a===f||a===-f){var b=0>a?-1:1;return b*g}return a===a?a:0}var e=a("./toNumber"),f=1/0,g=1.7976931348623157e308;b.exports=d},{"./toNumber":265}],264:[function(a,b,c){function d(a){var b=e(a),c=b%1;return b===b?c?b-c:b:0}var e=a("./toFinite");b.exports=d},{"./toFinite":263}],265:[function(a,b,c){function d(a){if("number"==typeof a)return a;if(g(a))return h;if(f(a)){var b=e(a.valueOf)?a.valueOf():a;a=f(b)?b+"":b}if("string"!=typeof a)return 0===a?a:+a;a=a.replace(i,"");var c=k.test(a);return c||l.test(a)?m(a.slice(2),c?2:8):j.test(a)?h:+a}var e=a("./isFunction"),f=a("./isObject"),g=a("./isSymbol"),h=NaN,i=/^\s+|\s+$/g,j=/^[-+]0x[0-9a-f]+$/i,k=/^0b[01]+$/i,l=/^0o[0-7]+$/i,m=parseInt;b.exports=d},{"./isFunction":242,"./isObject":245,"./isSymbol":249}],266:[function(a,b,c){function d(a){return e(a,f(a))}var e=a("./_copyObject"),f=a("./keysIn");b.exports=d},{"./_copyObject":158,"./keysIn":253}],267:[function(a,b,c){function d(a){return null==a?"":e(a)}var e=a("./_baseToString");b.exports=d},{"./_baseToString":144}]},{},[21]);;
/**
 * JavaScript file that handles initializing and firing the Yoast
 * js-text-analysis library.
 * Support YoastSEO.js v1.2.2.
 */
(function ($) {
  Drupal.yoast_seo = Drupal.yoast_seo || {};
  Drupal.yoast_seo_node_new = false;
  
  Drupal.behaviors.yoast_seo = {
    attach: function (context, settings) {
      if(settings.path && settings.path.currentPath.indexOf('node/add') != -1){
        Drupal.yoast_seo_node_new = true;
      }
      // Making sure we actually have data.
      if (typeof settings.yoast_seo != 'undefined') {
        var yoast_settings = settings.yoast_seo;
        // Making sure we only initiate Yoast SEO once.
        $('body', context).once('yoast_seo').each(function () {
          YoastSEO.analyzerArgs = {
            source: YoastSEO_DrupalSource,
            analyzer: yoast_settings.analyzer,
            snippetPreview: yoast_settings.snippet_preview,
            elementTarget: [yoast_settings.wrapper_target_id],
            typeDelay: 300,
            typeDelayStep: 100,
            maxTypeDelay: 1500,
            dynamicDelay: true,
            multiKeyword: false,
            tokens: yoast_settings.tokens,
            targets: {
              output: yoast_settings.targets.output_target_id,
              overall: yoast_settings.targets.overall_score_target_id,
              snippet: yoast_settings.targets.snippet_target_id
            },
            snippetFields: {
              title: "snippet-editor-title",
              url: "snippet-editor-slug",
              meta: "snippet-editor-meta-description"
            },
            sampleText: {
              baseUrl: yoast_settings.base_root + '/',
              title: yoast_settings.default_text.meta_title,
              meta: yoast_settings.default_text.meta_description,
              keyword: yoast_settings.default_text.keyword,
              text: yoast_settings.default_text.body
            },
            fields: {
              keyword: yoast_settings.fields.focus_keyword,
              title: yoast_settings.fields.meta_title,
              nodeTitle: yoast_settings.fields.title,
              meta: yoast_settings.fields.meta_description,
              text: yoast_settings.fields.body,
              url: yoast_settings.fields.path,
              summary: yoast_settings.fields.summary
            },
            placeholderText: {
              title: yoast_settings.placeholder_text.snippetTitle,
              description: yoast_settings.placeholder_text.snippetMeta,
              url: yoast_settings.placeholder_text.snippetCite
            },
            SEOTitleOverwritten: yoast_settings.seo_title_overwritten,
            scoreElement: yoast_settings.fields.seo_status,
            baseRoot: yoast_settings.base_root
          };
          // Create a new Yoast SEO instance.
          if (typeof YoastSEO != "undefined") {
            var DrupalSource = new YoastSEO_DrupalSource(YoastSEO.analyzerArgs);
            // Declaring the callback functions, for now we bind DrupalSource.
            YoastSEO.analyzerArgs.callbacks = {
              getData: DrupalSource.getData.bind(DrupalSource),
              bindElementEvents: DrupalSource.bindElementEvents.bind(DrupalSource),
              saveSnippetData: DrupalSource.saveSnippetData.bind(DrupalSource),
              saveScores: DrupalSource.saveScores.bind(DrupalSource)
            };

            // Make it global.
            window.YoastSEO.app = new YoastSEO.App(YoastSEO.analyzerArgs);

            // Parse the input from snippet preview fields to their corresponding metatag and path fields
            DrupalSource.parseSnippetData(YoastSEO.analyzerArgs.snippetFields.title, YoastSEO.analyzerArgs.fields.title);
            DrupalSource.parseSnippetData(YoastSEO.analyzerArgs.snippetFields.url, YoastSEO.analyzerArgs.fields.url);
            DrupalSource.parseSnippetData(YoastSEO.analyzerArgs.snippetFields.meta, YoastSEO.analyzerArgs.fields.meta);

            // No enter on contenteditable fields.
            $("#snippet_title, #snippet_cite, #snippet_meta").keypress(function (e) {
              if (e.keyCode == 13) {
                e.preventDefault();
              }
            });

            if (typeof CKEDITOR !== "undefined") {
              CKEDITOR.on('instanceReady', function (ev) {
                var editor = ev.editor;
                // Check if this the instance we want to track.
                if (typeof YoastSEO.analyzerArgs.fields.text != 'undefined') {
                  if (editor.name == YoastSEO.analyzerArgs.fields.text) {
                    editor.on('change', function () {
                      // Let CKEditor handle updating the linked text element.
                      editor.updateElement();
                      // Dispatch input event so Yoast SEO knows something changed!
                      DrupalSource.triggerEvent(editor.name);
                    });
                  }
                }
              });
            }
          }
          else {
            $('#' + settings.yoast_seo.targets.output).html('<p><strong>' + Drupal.t('It looks like something went wrong when we tried to load the Yoast SEO content analysis library. Please check it the module is installed correctly.') + '</strong></p>');
          }
        });
      } else {
        throw 'YoastSEO settings are not defined';
      }
    }
  }
})(jQuery);

/**
 * Inputgenerator generates a form for use as input.
 * @param args
 * @param refObj
 * @constructor
 */
YoastSEO_DrupalSource = function (args) {
  this.config = args;
  this.refObj = {};
  this.analyzerData = {};
  this.tokensRemote = {};
};

/**
 * Sets field value and dispatches an event to fire content analysis magic
 * @param field
 */
YoastSEO_DrupalSource.prototype.triggerEvent = function (field) {
  if ("createEvent" in document) {
    var ev = document.createEvent("HTMLEvents");
    ev.initEvent("input", false, true);
    document.getElementById(field).dispatchEvent(ev);
  }
  else {
    document.getElementById(field).fireEvent("input");
  }
};

/**
 * Parses the input in snippet preview fields on input evt to data in the metatag and path fields
 * @param source
 * @param target
 */
YoastSEO_DrupalSource.prototype.parseSnippetData = function (source, target) {
  var listener = function (ev) {
    // textContent support for FF and if both innerText and textContent are
    // undefined we use an empty string.
    document.getElementById(target).value = (ev.target.value || "");
    this.triggerEvent(target);
  }.bind(this);
  document.getElementById(source).addEventListener("blur", listener);
};


/**
 * Grabs data from the refObj and returns populated analyzerData
 * @returns analyzerData
 */
YoastSEO_DrupalSource.prototype.getData = function () {
  // Default data in here.
  data = {
    keyword: this.getDataFromInput("keyword"),
    meta: this.getDataFromInput("meta"),
    snippetMeta: this.getDataFromInput("meta"),
    text: this.getDataFromInput("text"),
    pageTitle: this.getDataFromInput("title"),
    snippetTitle: this.getDataFromInput("title"),
    baseUrl: this.config.baseRoot,
    url: this.config.baseRoot + this.getDataFromInput("url"),
    snippetCite: this.getDataFromInput("url")
  };

  return data;
};

YoastSEO_DrupalSource.prototype.getDataFromInput = function (field) {
  var value;
  // If this is an array of id's
  if (this.config.fields[field] instanceof Array) {
    var output = [];
    for (var text_field in this.config.fields[field]) {
      if (
        typeof this.config.fields[field][text_field] != 'undefined'
        && document.getElementById(this.config.fields[field][text_field])
        && document.getElementById(this.config.fields[field][text_field]).value != ''
      ) {
        output.push(document.getElementById(this.config.fields[field][text_field]).value);
      }
    }
    value = output.join("\n");
  } else {
    value = document.getElementById(this.config.fields[field]).value;
  }

  return this.tokenReplace(value);
};

/**
 * Grabs data from the refObj and returns populated analyzerData
 * @returns analyzerData
 */
YoastSEO_DrupalSource.prototype.updateRawData = function () {
  var data = {
    keyword: this.getDataFromInput("keyword"),
    meta: this.getDataFromInput("meta"),
    snippetMeta: this.getDataFromInput("meta"),
    text: this.getDataFromInput("text"),
    nodeTitle: this.getDataFromInput("nodeTitle"),
    pageTitle: this.getDataFromInput("title"),
    baseUrl: this.config.baseRoot,
    url: this.config.baseRoot + '/' + this.getDataFromInput("url"),
    snippetCite: this.getDataFromInput("url")
  };

  if (!this.config.SEOTitleOverwritten) {
    data.pageTitle = data.nodeTitle;
    data.snippetTitle = data.nodeTitle;

    document.getElementById(this.config.fields.title).value = data.nodeTitle;
  }

  // Placeholder text in snippet if nothing was found.
  if (data.meta == '') {
    data.snippetMeta = this.config.placeholderText.description;
  }
  if (data.pageTitle == '') {
    data.snippetTitle = this.config.placeholderText.title;
  }
  if (data.snippetCite == '') {
    data.snippetCite = this.config.placeholderText.url;
  }

  YoastSEO.app.rawData = data;
};

/**
 * Calls the eventbinders.
 */
YoastSEO_DrupalSource.prototype.bindElementEvents = function () {
  this.inputElementEventBinder();
};

/**
 * Binds the renewData function on the change of inputelements.
 */
YoastSEO_DrupalSource.prototype.inputElementEventBinder = function () {
  for (field in this.config.fields) {
    if (this.config.fields[field] instanceof Array) {
      for (var text_field in this.config.fields[field]) {
        if (typeof this.config.fields[field][text_field] != 'undefined' && document.getElementById(this.config.fields[field][text_field])) {
          document.getElementById(this.config.fields[field][text_field]).__refObj = this;
          document.getElementById(this.config.fields[field][text_field]).addEventListener("input", this.renewData.bind(this));
        }
      }
    }
    if (typeof this.config.fields[field] != 'undefined' && document.getElementById(this.config.fields[field])) {
      document.getElementById(this.config.fields[field]).__refObj = this;
      document.getElementById(this.config.fields[field]).addEventListener("input", this.renewData.bind(this));
    }
  }
};

/**
 * Calls getAnalyzerinput function on change event from element
 * @param event
 */
YoastSEO_DrupalSource.prototype.renewData = function (ev) {
  // @TODO: implement snippetPreview rebuild
  if (!this.config.SEOTitleOverwritten && (ev.target.id == this.config.fields.nodeTitle || ev.target.id == this.config.snippetFields.title)) {
    var $this = this;
    setTimeout(function () {
      $this.config.SEOTitleOverwritten = true;
      document.getElementById(YoastSEO.app.config.fields.title).value = ev.target.value;
      document.getElementById($this.config.snippetFields.title).value = ev.target.value;
      $this.triggerEvent(YoastSEO.app.config.snippetFields.title);
    }, 3000);
  }
  
  //If node is new we could use new typed title for js tokens  
  if (ev.target.id == this.config.fields.nodeTitle && Drupal.yoast_seo_node_new) {
    var metatagTitle =  document.getElementById(this.config.fields.title).value;
    //If node is new replace token title with value from input title
    //@todo: Review logic for better implement and remove hard 
    //[current-page:title]
    if(metatagTitle.indexOf('[current-page:title]') != -1){
      metatagTitle = metatagTitle.replace('[current-page:title]', ev.target.value);
    }
    //[node:title]
    if(metatagTitle.indexOf('[node:title]') != -1){
      metatagTitle = metatagTitle.replace('[node:title]', ev.target.value);
    }
    document.getElementById(this.config.snippetFields.title).value = this.tokenReplace(metatagTitle);
    this.triggerEvent(this.config.snippetFields.title);
  }

  if (ev.target.id == this.config.fields.title) {
    document.getElementById(this.config.snippetFields.title).value = this.tokenReplace(ev.target.value);
    this.triggerEvent(this.config.snippetFields.title);
  }

  if (ev.target.id == this.config.fields.meta) {
    document.getElementById(this.config.snippetFields.meta).value = this.tokenReplace(ev.target.value);
    this.triggerEvent(this.config.snippetFields.meta);
  }

  if (ev.target.id == this.config.fields.url) {
    document.getElementById(this.config.snippetFields.url).value = this.tokenReplace(ev.target.value);
    this.triggerEvent(this.config.snippetFields.url);
  }

  YoastSEO.app.refresh();
};

/**
 * Save the snippet values, but in reality we ignore this.
 *
 * @param {Object} ev
 */
YoastSEO_DrupalSource.prototype.saveSnippetData = function (ev) {
};

/**
 * retuns a string that is used as a CSSclass, based on the numeric score
 * @param score
 * @returns output
 */
YoastSEO_DrupalSource.prototype.scoreRating = function (rating) {
  var scoreRate;

  if (rating <= 4) {
    scoreRate = "bad";
  }

  if (rating > 4 && rating <= 7) {
    scoreRate = "ok";
  }

  if (rating > 7) {
    scoreRate = "good";
  }

  if (rating == 0) {
    scoreRate = "na";
  }

  return Drupal.t("SEO: <strong>" + scoreRate + "</strong>");
};

/**
 * Sets the SEO score in the hidden element.
 * @param score
 */
YoastSEO_DrupalSource.prototype.saveScores = function (score) {
  var rating = 0;
  if (typeof score == "number" && score > 0) {
    rating = ( score / 10 );
  }

  document.getElementById(this.config.targets.overall).getElementsByClassName("score_value")[0].innerHTML = this.scoreRating(rating);
  document.querySelector('[data-drupal-selector="' + this.config.scoreElement + '"]').setAttribute('value', rating);
};

/**
 * Replace tokens.
 */
YoastSEO_DrupalSource.prototype.tokenReplace = function (value) {
  var self = this,
    tokenRegex = /(\[[^\]]*:[^\]]*\])/g,
    match = value.match(tokenRegex),
    tokensNotFound = [];
 
  // If the value contains tokens.
  if (match != null) {
    // Replace all the tokens by their relative value.
    for (var i in match) {
      var tokenRelativeField = null,
        tokenRawValue = false;

      // Check if the token is relative to a field present on the page.
      if (typeof this.config.tokens[match[i]] != 'undefined') {
        tokenRawValue = true;
        tokenRelativeField = this.config.tokens[match[i]];
      }

      if (tokenRawValue == true) {
        if (typeof this.config.fields[tokenRelativeField] != 'undefined') {
          // Use node title field value.
          if (tokenRelativeField == 'title') {
            tokenRelativeField = 'nodeTitle';
          }

          value = value.replace(match[i], document.getElementById(this.config.fields[tokenRelativeField]).value);
        } else {
          value = value.replace(match[i], this.config.tokens[match[i]]);
        }
      }
      // The token value has to be found remotely.
      else {
        // If the token value has already been resolved and stored locally.
        if (typeof this.tokensRemote[match[i]] != 'undefined') {
          value = value.replace(match[i], this.tokensRemote[match[i]]);
        }
        else {
          tokensNotFound.push(match[i]);
        }
      }
    }

    // If some tokens hasn't been resolved locally.
    // Try to solve them remotely.
    if (tokensNotFound.length) {
      jQuery.ajax({
        async: false,
        url: Drupal.url('yoast_seo/tokens'),
        type: 'POST',
        data: {'tokens[]': tokensNotFound},
        dataType: 'json'
      }).then(function (data) {
        // Store their value locally.
        // It will avoid an unnecessary call to the server.
        for (var token in data) {
          self.tokensRemote[token] = data[token];
          value = value.replace(token, self.tokensRemote[token]);
        }
      });
    }
  }
  
  return value;
};
;
/*!
 * jQuery Form Plugin
 * version: 4.3.0
 * Requires jQuery v1.7.2 or later
 * Project repository: https://github.com/jquery-form/form

 * Copyright 2017 Kevin Morris
 * Copyright 2006 M. Alsup

 * Dual licensed under the LGPL-2.1+ or MIT licenses
 * https://github.com/jquery-form/form#license

 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 */
!function(r){"function"==typeof define&&define.amd?define(["jquery"],r):"object"==typeof module&&module.exports?module.exports=function(e,t){return void 0===t&&(t="undefined"!=typeof window?require("jquery"):require("jquery")(e)),r(t),t}:r(jQuery)}(function(q){"use strict";var m=/\r?\n/g,S={};S.fileapi=void 0!==q('<input type="file">').get(0).files,S.formdata=void 0!==window.FormData;var _=!!q.fn.prop;function o(e){var t=e.data;e.isDefaultPrevented()||(e.preventDefault(),q(e.target).closest("form").ajaxSubmit(t))}function i(e){var t=e.target,r=q(t);if(!r.is("[type=submit],[type=image]")){var a=r.closest("[type=submit]");if(0===a.length)return;t=a[0]}var n,o=t.form;"image"===(o.clk=t).type&&(void 0!==e.offsetX?(o.clk_x=e.offsetX,o.clk_y=e.offsetY):"function"==typeof q.fn.offset?(n=r.offset(),o.clk_x=e.pageX-n.left,o.clk_y=e.pageY-n.top):(o.clk_x=e.pageX-t.offsetLeft,o.clk_y=e.pageY-t.offsetTop)),setTimeout(function(){o.clk=o.clk_x=o.clk_y=null},100)}function N(){var e;q.fn.ajaxSubmit.debug&&(e="[jquery.form] "+Array.prototype.join.call(arguments,""),window.console&&window.console.log?window.console.log(e):window.opera&&window.opera.postError&&window.opera.postError(e))}q.fn.attr2=function(){if(!_)return this.attr.apply(this,arguments);var e=this.prop.apply(this,arguments);return e&&e.jquery||"string"==typeof e?e:this.attr.apply(this,arguments)},q.fn.ajaxSubmit=function(M,e,t,r){if(!this.length)return N("ajaxSubmit: skipping submit process - no element selected"),this;var O,a,n,o,X=this;"function"==typeof M?M={success:M}:"string"==typeof M||!1===M&&0<arguments.length?(M={url:M,data:e,dataType:t},"function"==typeof r&&(M.success=r)):void 0===M&&(M={}),O=M.method||M.type||this.attr2("method"),n=(n=(n="string"==typeof(a=M.url||this.attr2("action"))?q.trim(a):"")||window.location.href||"")&&(n.match(/^([^#]+)/)||[])[1],o=/(MSIE|Trident)/.test(navigator.userAgent||"")&&/^https/i.test(window.location.href||"")?"javascript:false":"about:blank",M=q.extend(!0,{url:n,success:q.ajaxSettings.success,type:O||q.ajaxSettings.type,iframeSrc:o},M);var i={};if(this.trigger("form-pre-serialize",[this,M,i]),i.veto)return N("ajaxSubmit: submit vetoed via form-pre-serialize trigger"),this;if(M.beforeSerialize&&!1===M.beforeSerialize(this,M))return N("ajaxSubmit: submit aborted via beforeSerialize callback"),this;var s=M.traditional;void 0===s&&(s=q.ajaxSettings.traditional);var u,c,C=[],l=this.formToArray(M.semantic,C,M.filtering);if(M.data&&(c=q.isFunction(M.data)?M.data(l):M.data,M.extraData=c,u=q.param(c,s)),M.beforeSubmit&&!1===M.beforeSubmit(l,this,M))return N("ajaxSubmit: submit aborted via beforeSubmit callback"),this;if(this.trigger("form-submit-validate",[l,this,M,i]),i.veto)return N("ajaxSubmit: submit vetoed via form-submit-validate trigger"),this;var f=q.param(l,s);u&&(f=f?f+"&"+u:u),"GET"===M.type.toUpperCase()?(M.url+=(0<=M.url.indexOf("?")?"&":"?")+f,M.data=null):M.data=f;var d,m,p,h=[];M.resetForm&&h.push(function(){X.resetForm()}),M.clearForm&&h.push(function(){X.clearForm(M.includeHidden)}),!M.dataType&&M.target?(d=M.success||function(){},h.push(function(e,t,r){var a=arguments,n=M.replaceTarget?"replaceWith":"html";q(M.target)[n](e).each(function(){d.apply(this,a)})})):M.success&&(q.isArray(M.success)?q.merge(h,M.success):h.push(M.success)),M.success=function(e,t,r){for(var a=M.context||this,n=0,o=h.length;n<o;n++)h[n].apply(a,[e,t,r||X,X])},M.error&&(m=M.error,M.error=function(e,t,r){var a=M.context||this;m.apply(a,[e,t,r,X])}),M.complete&&(p=M.complete,M.complete=function(e,t){var r=M.context||this;p.apply(r,[e,t,X])});var v=0<q("input[type=file]:enabled",this).filter(function(){return""!==q(this).val()}).length,g="multipart/form-data",x=X.attr("enctype")===g||X.attr("encoding")===g,y=S.fileapi&&S.formdata;N("fileAPI :"+y);var b,T=(v||x)&&!y;!1!==M.iframe&&(M.iframe||T)?M.closeKeepAlive?q.get(M.closeKeepAlive,function(){b=w(l)}):b=w(l):b=(v||x)&&y?function(e){for(var r=new FormData,t=0;t<e.length;t++)r.append(e[t].name,e[t].value);if(M.extraData){var a=function(e){var t,r,a=q.param(e,M.traditional).split("&"),n=a.length,o=[];for(t=0;t<n;t++)a[t]=a[t].replace(/\+/g," "),r=a[t].split("="),o.push([decodeURIComponent(r[0]),decodeURIComponent(r[1])]);return o}(M.extraData);for(t=0;t<a.length;t++)a[t]&&r.append(a[t][0],a[t][1])}M.data=null;var n=q.extend(!0,{},q.ajaxSettings,M,{contentType:!1,processData:!1,cache:!1,type:O||"POST"});M.uploadProgress&&(n.xhr=function(){var e=q.ajaxSettings.xhr();return e.upload&&e.upload.addEventListener("progress",function(e){var t=0,r=e.loaded||e.position,a=e.total;e.lengthComputable&&(t=Math.ceil(r/a*100)),M.uploadProgress(e,r,a,t)},!1),e});n.data=null;var o=n.beforeSend;return n.beforeSend=function(e,t){M.formData?t.data=M.formData:t.data=r,o&&o.call(this,e,t)},q.ajax(n)}(l):q.ajax(M),X.removeData("jqxhr").data("jqxhr",b);for(var j=0;j<C.length;j++)C[j]=null;return this.trigger("form-submit-notify",[this,M]),this;function w(e){var t,r,l,f,o,d,m,p,a,n,h,v,i=X[0],g=q.Deferred();if(g.abort=function(e){p.abort(e)},e)for(r=0;r<C.length;r++)t=q(C[r]),_?t.prop("disabled",!1):t.removeAttr("disabled");(l=q.extend(!0,{},q.ajaxSettings,M)).context=l.context||l,o="jqFormIO"+(new Date).getTime();var s=i.ownerDocument,u=X.closest("body");if(l.iframeTarget?(n=(d=q(l.iframeTarget,s)).attr2("name"))?o=n:d.attr2("name",o):(d=q('<iframe name="'+o+'" src="'+l.iframeSrc+'" />',s)).css({position:"absolute",top:"-1000px",left:"-1000px"}),m=d[0],p={aborted:0,responseText:null,responseXML:null,status:0,statusText:"n/a",getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(e){var t="timeout"===e?"timeout":"aborted";N("aborting upload... "+t),this.aborted=1;try{m.contentWindow.document.execCommand&&m.contentWindow.document.execCommand("Stop")}catch(e){}d.attr("src",l.iframeSrc),p.error=t,l.error&&l.error.call(l.context,p,t,e),f&&q.event.trigger("ajaxError",[p,l,t]),l.complete&&l.complete.call(l.context,p,t)}},(f=l.global)&&0==q.active++&&q.event.trigger("ajaxStart"),f&&q.event.trigger("ajaxSend",[p,l]),l.beforeSend&&!1===l.beforeSend.call(l.context,p,l))return l.global&&q.active--,g.reject(),g;if(p.aborted)return g.reject(),g;(a=i.clk)&&(n=a.name)&&!a.disabled&&(l.extraData=l.extraData||{},l.extraData[n]=a.value,"image"===a.type&&(l.extraData[n+".x"]=i.clk_x,l.extraData[n+".y"]=i.clk_y));var x=1,y=2;function b(t){var r=null;try{t.contentWindow&&(r=t.contentWindow.document)}catch(e){N("cannot get iframe.contentWindow document: "+e)}if(r)return r;try{r=t.contentDocument?t.contentDocument:t.document}catch(e){N("cannot get iframe.contentDocument: "+e),r=t.document}return r}var c=q("meta[name=csrf-token]").attr("content"),T=q("meta[name=csrf-param]").attr("content");function j(){var e=X.attr2("target"),t=X.attr2("action"),r=X.attr("enctype")||X.attr("encoding")||"multipart/form-data";i.setAttribute("target",o),O&&!/post/i.test(O)||i.setAttribute("method","POST"),t!==l.url&&i.setAttribute("action",l.url),l.skipEncodingOverride||O&&!/post/i.test(O)||X.attr({encoding:"multipart/form-data",enctype:"multipart/form-data"}),l.timeout&&(v=setTimeout(function(){h=!0,A(x)},l.timeout));var a=[];try{if(l.extraData)for(var n in l.extraData)l.extraData.hasOwnProperty(n)&&(q.isPlainObject(l.extraData[n])&&l.extraData[n].hasOwnProperty("name")&&l.extraData[n].hasOwnProperty("value")?a.push(q('<input type="hidden" name="'+l.extraData[n].name+'">',s).val(l.extraData[n].value).appendTo(i)[0]):a.push(q('<input type="hidden" name="'+n+'">',s).val(l.extraData[n]).appendTo(i)[0]));l.iframeTarget||d.appendTo(u),m.attachEvent?m.attachEvent("onload",A):m.addEventListener("load",A,!1),setTimeout(function e(){try{var t=b(m).readyState;N("state = "+t),t&&"uninitialized"===t.toLowerCase()&&setTimeout(e,50)}catch(e){N("Server abort: ",e," (",e.name,")"),A(y),v&&clearTimeout(v),v=void 0}},15);try{i.submit()}catch(e){document.createElement("form").submit.apply(i)}}finally{i.setAttribute("action",t),i.setAttribute("enctype",r),e?i.setAttribute("target",e):X.removeAttr("target"),q(a).remove()}}T&&c&&(l.extraData=l.extraData||{},l.extraData[T]=c),l.forceSync?j():setTimeout(j,10);var w,S,k,D=50;function A(e){if(!p.aborted&&!k){if((S=b(m))||(N("cannot access response document"),e=y),e===x&&p)return p.abort("timeout"),void g.reject(p,"timeout");if(e===y&&p)return p.abort("server abort"),void g.reject(p,"error","server abort");if(S&&S.location.href!==l.iframeSrc||h){m.detachEvent?m.detachEvent("onload",A):m.removeEventListener("load",A,!1);var t,r="success";try{if(h)throw"timeout";var a="xml"===l.dataType||S.XMLDocument||q.isXMLDoc(S);if(N("isXml="+a),!a&&window.opera&&(null===S.body||!S.body.innerHTML)&&--D)return N("requeing onLoad callback, DOM not available"),void setTimeout(A,250);var n=S.body?S.body:S.documentElement;p.responseText=n?n.innerHTML:null,p.responseXML=S.XMLDocument?S.XMLDocument:S,a&&(l.dataType="xml"),p.getResponseHeader=function(e){return{"content-type":l.dataType}[e.toLowerCase()]},n&&(p.status=Number(n.getAttribute("status"))||p.status,p.statusText=n.getAttribute("statusText")||p.statusText);var o,i,s,u=(l.dataType||"").toLowerCase(),c=/(json|script|text)/.test(u);c||l.textarea?(o=S.getElementsByTagName("textarea")[0])?(p.responseText=o.value,p.status=Number(o.getAttribute("status"))||p.status,p.statusText=o.getAttribute("statusText")||p.statusText):c&&(i=S.getElementsByTagName("pre")[0],s=S.getElementsByTagName("body")[0],i?p.responseText=i.textContent?i.textContent:i.innerText:s&&(p.responseText=s.textContent?s.textContent:s.innerText)):"xml"===u&&!p.responseXML&&p.responseText&&(p.responseXML=F(p.responseText));try{w=E(p,u,l)}catch(e){r="parsererror",p.error=t=e||r}}catch(e){N("error caught: ",e),r="error",p.error=t=e||r}p.aborted&&(N("upload aborted"),r=null),p.status&&(r=200<=p.status&&p.status<300||304===p.status?"success":"error"),"success"===r?(l.success&&l.success.call(l.context,w,"success",p),g.resolve(p.responseText,"success",p),f&&q.event.trigger("ajaxSuccess",[p,l])):r&&(void 0===t&&(t=p.statusText),l.error&&l.error.call(l.context,p,r,t),g.reject(p,"error",t),f&&q.event.trigger("ajaxError",[p,l,t])),f&&q.event.trigger("ajaxComplete",[p,l]),f&&!--q.active&&q.event.trigger("ajaxStop"),l.complete&&l.complete.call(l.context,p,r),k=!0,l.timeout&&clearTimeout(v),setTimeout(function(){l.iframeTarget?d.attr("src",l.iframeSrc):d.remove(),p.responseXML=null},100)}}}var F=q.parseXML||function(e,t){return window.ActiveXObject?((t=new ActiveXObject("Microsoft.XMLDOM")).async="false",t.loadXML(e)):t=(new DOMParser).parseFromString(e,"text/xml"),t&&t.documentElement&&"parsererror"!==t.documentElement.nodeName?t:null},L=q.parseJSON||function(e){return window.eval("("+e+")")},E=function(e,t,r){var a=e.getResponseHeader("content-type")||"",n=("xml"===t||!t)&&0<=a.indexOf("xml"),o=n?e.responseXML:e.responseText;return n&&"parsererror"===o.documentElement.nodeName&&q.error&&q.error("parsererror"),r&&r.dataFilter&&(o=r.dataFilter(o,t)),"string"==typeof o&&(("json"===t||!t)&&0<=a.indexOf("json")?o=L(o):("script"===t||!t)&&0<=a.indexOf("javascript")&&q.globalEval(o)),o};return g}},q.fn.ajaxForm=function(e,t,r,a){if(("string"==typeof e||!1===e&&0<arguments.length)&&(e={url:e,data:t,dataType:r},"function"==typeof a&&(e.success=a)),(e=e||{}).delegation=e.delegation&&q.isFunction(q.fn.on),e.delegation||0!==this.length)return e.delegation?(q(document).off("submit.form-plugin",this.selector,o).off("click.form-plugin",this.selector,i).on("submit.form-plugin",this.selector,e,o).on("click.form-plugin",this.selector,e,i),this):(e.beforeFormUnbind&&e.beforeFormUnbind(this,e),this.ajaxFormUnbind().on("submit.form-plugin",e,o).on("click.form-plugin",e,i));var n={s:this.selector,c:this.context};return!q.isReady&&n.s?(N("DOM not ready, queuing ajaxForm"),q(function(){q(n.s,n.c).ajaxForm(e)})):N("terminating; zero elements found by selector"+(q.isReady?"":" (DOM not ready)")),this},q.fn.ajaxFormUnbind=function(){return this.off("submit.form-plugin click.form-plugin")},q.fn.formToArray=function(e,t,r){var a=[];if(0===this.length)return a;var n,o,i,s,u,c,l,f,d,m,p=this[0],h=this.attr("id"),v=(v=e||void 0===p.elements?p.getElementsByTagName("*"):p.elements)&&q.makeArray(v);if(h&&(e||/(Edge|Trident)\//.test(navigator.userAgent))&&(n=q(':input[form="'+h+'"]').get()).length&&(v=(v||[]).concat(n)),!v||!v.length)return a;for(q.isFunction(r)&&(v=q.map(v,r)),o=0,c=v.length;o<c;o++)if((m=(u=v[o]).name)&&!u.disabled)if(e&&p.clk&&"image"===u.type)p.clk===u&&(a.push({name:m,value:q(u).val(),type:u.type}),a.push({name:m+".x",value:p.clk_x},{name:m+".y",value:p.clk_y}));else if((s=q.fieldValue(u,!0))&&s.constructor===Array)for(t&&t.push(u),i=0,l=s.length;i<l;i++)a.push({name:m,value:s[i]});else if(S.fileapi&&"file"===u.type){t&&t.push(u);var g=u.files;if(g.length)for(i=0;i<g.length;i++)a.push({name:m,value:g[i],type:u.type});else a.push({name:m,value:"",type:u.type})}else null!=s&&(t&&t.push(u),a.push({name:m,value:s,type:u.type,required:u.required}));return e||!p.clk||(m=(d=(f=q(p.clk))[0]).name)&&!d.disabled&&"image"===d.type&&(a.push({name:m,value:f.val()}),a.push({name:m+".x",value:p.clk_x},{name:m+".y",value:p.clk_y})),a},q.fn.formSerialize=function(e){return q.param(this.formToArray(e))},q.fn.fieldSerialize=function(n){var o=[];return this.each(function(){var e=this.name;if(e){var t=q.fieldValue(this,n);if(t&&t.constructor===Array)for(var r=0,a=t.length;r<a;r++)o.push({name:e,value:t[r]});else null!=t&&o.push({name:this.name,value:t})}}),q.param(o)},q.fn.fieldValue=function(e){for(var t=[],r=0,a=this.length;r<a;r++){var n=this[r],o=q.fieldValue(n,e);null==o||o.constructor===Array&&!o.length||(o.constructor===Array?q.merge(t,o):t.push(o))}return t},q.fieldValue=function(e,t){var r=e.name,a=e.type,n=e.tagName.toLowerCase();if(void 0===t&&(t=!0),t&&(!r||e.disabled||"reset"===a||"button"===a||("checkbox"===a||"radio"===a)&&!e.checked||("submit"===a||"image"===a)&&e.form&&e.form.clk!==e||"select"===n&&-1===e.selectedIndex))return null;if("select"!==n)return q(e).val().replace(m,"\r\n");var o=e.selectedIndex;if(o<0)return null;for(var i=[],s=e.options,u="select-one"===a,c=u?o+1:s.length,l=u?o:0;l<c;l++){var f=s[l];if(f.selected&&!f.disabled){var d=(d=f.value)||(f.attributes&&f.attributes.value&&!f.attributes.value.specified?f.text:f.value);if(u)return d;i.push(d)}}return i},q.fn.clearForm=function(e){return this.each(function(){q("input,select,textarea",this).clearFields(e)})},q.fn.clearFields=q.fn.clearInputs=function(r){var a=/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;return this.each(function(){var e=this.type,t=this.tagName.toLowerCase();a.test(e)||"textarea"===t?this.value="":"checkbox"===e||"radio"===e?this.checked=!1:"select"===t?this.selectedIndex=-1:"file"===e?/MSIE/.test(navigator.userAgent)?q(this).replaceWith(q(this).clone(!0)):q(this).val(""):r&&(!0===r&&/hidden/.test(e)||"string"==typeof r&&q(this).is(r))&&(this.value="")})},q.fn.resetForm=function(){return this.each(function(){var t=q(this),e=this.tagName.toLowerCase();switch(e){case"input":this.checked=this.defaultChecked;case"textarea":return this.value=this.defaultValue,!0;case"option":case"optgroup":var r=t.parents("select");return r.length&&r[0].multiple?"option"===e?this.selected=this.defaultSelected:t.find("option").resetForm():r.resetForm(),!0;case"select":return t.find("option").each(function(e){if(this.selected=this.defaultSelected,this.defaultSelected&&!t[0].multiple)return t[0].selectedIndex=e,!1}),!0;case"label":var a=q(t.attr("for")),n=t.find("input,select,textarea");return a[0]&&n.unshift(a[0]),n.resetForm(),!0;case"form":return"function"!=typeof this.reset&&("object"!=typeof this.reset||this.reset.nodeType)||this.reset(),!0;default:return t.find("form,input,label,select,textarea").resetForm(),!0}})},q.fn.enable=function(e){return void 0===e&&(e=!0),this.each(function(){this.disabled=!e})},q.fn.selected=function(r){return void 0===r&&(r=!0),this.each(function(){var e,t=this.type;"checkbox"===t||"radio"===t?this.checked=r:"option"===this.tagName.toLowerCase()&&(e=q(this).parent("select"),r&&e[0]&&"select-one"===e[0].type&&e.find("option").selected(!1),this.selected=r)})},q.fn.ajaxSubmit.debug=!1});

;
