/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, _, Drupal) {
  Drupal.quickedit.editors.image = Drupal.quickedit.EditorView.extend({
    initialize: function initialize(options) {
      Drupal.quickedit.EditorView.prototype.initialize.call(this, options);
      this.model.set('originalValue', this.$el.html().trim());
      this.model.set('currentValue', function (index, value) {
        var matches = $(this).attr('name').match(/(alt|title)]$/);

        if (matches) {
          var name = matches[1];
          var $toolgroup = $("#".concat(options.fieldModel.toolbarView.getMainWysiwygToolgroupId()));
          var $input = $toolgroup.find(".quickedit-image-field-info input[name=\"".concat(name, "\"]"));

          if ($input.length) {
            return $input.val();
          }
        }
      });
    },
    stateChange: function stateChange(fieldModel, state, options) {
      var from = fieldModel.previous('state');

      switch (state) {
        case 'inactive':
          break;

        case 'candidate':
          if (from !== 'inactive') {
            this.$el.find('.quickedit-image-dropzone').remove();
            this.$el.removeClass('quickedit-image-element');
          }

          if (from === 'invalid') {
            this.removeValidationErrors();
          }

          break;

        case 'highlighted':
          break;

        case 'activating':
          _.defer(function () {
            fieldModel.set('state', 'active');
          });

          break;

        case 'active':
          {
            var self = this;
            this.$el.addClass('quickedit-image-element');
            var $dropzone = this.renderDropzone('upload', Drupal.t('Drop file here or click to upload'));
            $dropzone.on('dragenter', function (e) {
              $(this).addClass('hover');
            });
            $dropzone.on('dragleave', function (e) {
              $(this).removeClass('hover');
            });
            $dropzone.on('drop', function (e) {
              if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
                $(this).removeClass('hover');
                self.uploadImage(e.originalEvent.dataTransfer.files[0]);
              }
            });
            $dropzone.on('click', function (e) {
              $('<input type="file">').trigger('click').on('change', function () {
                if (this.files.length) {
                  self.uploadImage(this.files[0]);
                }
              });
            });
            $dropzone.on('dragover dragenter dragleave drop click', function (e) {
              e.preventDefault();
              e.stopPropagation();
            });
            this.renderToolbar(fieldModel);
            break;
          }

        case 'changed':
          break;

        case 'saving':
          if (from === 'invalid') {
            this.removeValidationErrors();
          }

          this.save(options);
          break;

        case 'saved':
          break;

        case 'invalid':
          this.showValidationErrors();
          break;
      }
    },
    uploadImage: function uploadImage(file) {
      this.renderDropzone('upload loading', Drupal.t('Uploading <i>@file</i>…', {
        '@file': file.name
      }));
      var fieldID = this.fieldModel.get('fieldID');
      var url = Drupal.quickedit.util.buildUrl(fieldID, Drupal.url('quickedit/image/upload/!entity_type/!id/!field_name/!langcode/!view_mode'));
      var data = new FormData();
      data.append('files[image]', file);
      var self = this;
      this.ajax({
        type: 'POST',
        url: url,
        data: data,
        success: function success(response) {
          var $el = $(self.fieldModel.get('el'));
          self.fieldModel.set('state', 'changed');
          self.fieldModel.get('entity').set('inTempStore', true);
          self.removeValidationErrors();
          var $content = $(response.html).closest('[data-quickedit-field-id]').children();
          $el.empty().append($content);
        }
      });
    },
    ajax: function ajax(options) {
      var defaultOptions = {
        context: this,
        dataType: 'json',
        cache: false,
        contentType: false,
        processData: false,
        error: function error() {
          this.renderDropzone('error', Drupal.t('A server error has occurred.'));
        }
      };
      var ajaxOptions = $.extend(defaultOptions, options);
      var successCallback = ajaxOptions.success;

      ajaxOptions.success = function (response) {
        if (response.main_error) {
          this.renderDropzone('error', response.main_error);

          if (response.errors.length) {
            this.model.set('validationErrors', response.errors);
          }

          this.showValidationErrors();
        } else {
          successCallback(response);
        }
      };

      $.ajax(ajaxOptions);
    },
    renderToolbar: function renderToolbar(fieldModel) {
      var $toolgroup = $("#".concat(fieldModel.toolbarView.getMainWysiwygToolgroupId()));
      var $toolbar = $toolgroup.find('.quickedit-image-field-info');

      if ($toolbar.length === 0) {
        var fieldID = fieldModel.get('fieldID');
        var url = Drupal.quickedit.util.buildUrl(fieldID, Drupal.url('quickedit/image/info/!entity_type/!id/!field_name/!langcode/!view_mode'));
        var self = this;
        self.ajax({
          type: 'GET',
          url: url,
          success: function success(response) {
            $toolbar = $(Drupal.theme.quickeditImageToolbar(response));
            $toolgroup.append($toolbar);
            $toolbar.on('keyup paste', function () {
              fieldModel.set('state', 'changed');
            });
            fieldModel.get('entity').toolbarView.position();
          }
        });
      }
    },
    renderDropzone: function renderDropzone(state, text) {
      var $dropzone = this.$el.find('.quickedit-image-dropzone');

      if ($dropzone.length) {
        $dropzone.removeClass('upload error hover loading').addClass(".quickedit-image-dropzone ".concat(state)).children('.quickedit-image-text').html(text);
      } else {
        $dropzone = $(Drupal.theme('quickeditImageDropzone', {
          state: state,
          text: text
        }));
        this.$el.append($dropzone);
      }

      return $dropzone;
    },
    revert: function revert() {
      this.$el.html(this.model.get('originalValue'));
    },
    getQuickEditUISettings: function getQuickEditUISettings() {
      return {
        padding: false,
        unifiedToolbar: true,
        fullWidthToolbar: true,
        popup: false
      };
    },
    showValidationErrors: function showValidationErrors() {
      var errors = Drupal.theme('quickeditImageErrors', {
        errors: this.model.get('validationErrors')
      });
      $("#".concat(this.fieldModel.toolbarView.getMainWysiwygToolgroupId())).append(errors);
      this.getEditedElement().addClass('quickedit-validation-error');
      this.fieldModel.get('entity').toolbarView.position();
    },
    removeValidationErrors: function removeValidationErrors() {
      $("#".concat(this.fieldModel.toolbarView.getMainWysiwygToolgroupId())).find('.quickedit-image-errors').remove();
      this.getEditedElement().removeClass('quickedit-validation-error');
    }
  });
})(jQuery, _, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function (Drupal) {
  Drupal.theme.quickeditImageErrors = function (settings) {
    return "<div class=\"quickedit-image-errors\">".concat(settings.errors, "</div>");
  };

  Drupal.theme.quickeditImageDropzone = function (settings) {
    return "<div class=\"quickedit-image-dropzone ".concat(settings.state, "\">") + '  <i class="quickedit-image-icon"></i>' + "  <span class=\"quickedit-image-text\">".concat(settings.text, "</span>") + '</div>';
  };

  Drupal.theme.quickeditImageToolbar = function (settings) {
    var html = '<form class="quickedit-image-field-info">';

    if (settings.alt_field) {
      html += "<div><label for=\"alt\" class=\"".concat(settings.alt_field_required ? 'required' : '', "\">").concat(Drupal.t('Alternative text'), "</label>") + "<input type=\"text\" placeholder=\"".concat(settings.alt, "\" value=\"").concat(settings.alt, "\" name=\"alt\" ").concat(settings.alt_field_required ? 'required' : '', "/>") + '  </div>';
    }

    if (settings.title_field) {
      html += "<div><label for=\"title\" class=\"".concat(settings.title_field_required ? 'form-required' : '', "\">").concat(Drupal.t('Title'), "</label>") + "<input type=\"text\" placeholder=\"".concat(settings.title, "\" value=\"").concat(settings.title, "\" name=\"title\" ").concat(settings.title_field_required ? 'required' : '', "/>") + '</div>';
    }

    html += '</form>';
    return html;
  };
})(Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, _, Drupal) {
  Drupal.quickedit.editors.plain_text = Drupal.quickedit.EditorView.extend({
    $textElement: null,
    initialize: function initialize(options) {
      Drupal.quickedit.EditorView.prototype.initialize.call(this, options);
      var editorModel = this.model;
      var fieldModel = this.fieldModel;
      var $fieldItems = this.$el.find('.quickedit-field');
      var $textElement = $fieldItems.length ? $fieldItems.eq(0) : this.$el;
      this.$textElement = $textElement;
      editorModel.set('originalValue', this.$textElement.text().trim());
      var previousText = editorModel.get('originalValue');
      $textElement.on('keyup paste', function (event) {
        var currentText = $textElement.text().trim();

        if (previousText !== currentText) {
          previousText = currentText;
          editorModel.set('currentValue', currentText);
          fieldModel.set('state', 'changed');
        }
      });
    },
    getEditedElement: function getEditedElement() {
      return this.$textElement;
    },
    stateChange: function stateChange(fieldModel, state, options) {
      var from = fieldModel.previous('state');
      var to = state;

      switch (to) {
        case 'inactive':
          break;

        case 'candidate':
          if (from !== 'inactive') {
            this.$textElement.removeAttr('contenteditable');
          }

          if (from === 'invalid') {
            this.removeValidationErrors();
          }

          break;

        case 'highlighted':
          break;

        case 'activating':
          _.defer(function () {
            fieldModel.set('state', 'active');
          });

          break;

        case 'active':
          this.$textElement.attr('contenteditable', 'true');
          break;

        case 'changed':
          break;

        case 'saving':
          if (from === 'invalid') {
            this.removeValidationErrors();
          }

          this.save(options);
          break;

        case 'saved':
          break;

        case 'invalid':
          this.showValidationErrors();
          break;
      }
    },
    getQuickEditUISettings: function getQuickEditUISettings() {
      return {
        padding: true,
        unifiedToolbar: false,
        fullWidthToolbar: false,
        popup: false
      };
    },
    revert: function revert() {
      this.$textElement.html(this.model.get('originalValue'));
    }
  });
})(jQuery, _, Drupal);;