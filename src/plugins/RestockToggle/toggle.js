/**
* @description Toggle for Restock Intel
* @param on boolean, on/off stauts 
* @param onChange function, callback of change event
* @param backgroundColor string, container background color
* @param handleActiveColor string, color of handle
*/
$.fn["RestockToggle"] = function (options) {
    var bkInactive = "#3C4E66";
    var doToggle = function (container, isActive = null) {
        toggle = container.find(".minitoggle");
        active = toggle.toggleClass("active").hasClass("active");
        active = isActive !== null ? isActive : active;
        handle = toggle.find(".toggle-handle");
        handlePosition = handle.position();
        offset = (active ? toggle.width() - handle.width() - (toggle.height() - handle.height()) - 1 : 0);
        handle.css({
            transform: "translate3d(" + offset + "px, 0, 0)",
        });
        applyColorOpts(container);
    }
    var applyColorOpts = function (container) {
        toggle = container.find(".minitoggle");
        active = toggle.hasClass("active");
        handle = toggle.find(".toggle-handle");
        if (options && options.backgroundColor !== undefined) {
            toggle.css({
                background: options.backgroundColor,
                borderColor: options.backgroundColor
            });
        }

        var handleColor = "#fff";
        if (typeof options === 'object' && options.handleActiveColor !== undefined) {
            container.data('handleColor', options.handleActiveColor);
        }
        if (container.data('handleColor') !== undefined) {
            handleColor = container.data('handleColor');
        }
        if (active) {
            handle.css({ background: handleColor });
        } else if (!active) {
            handle.css({ background: bkInactive });
        }
    }
    var getStatus = function (container) {
        toggle = container.find(".minitoggle");
        if (toggle.length === 0) return false;
        return toggle.hasClass("active");
    }
    if (typeof options === 'string') {
        if (options === 'status') {
            return getStatus($(this));
        }
    } else if (!options || typeof options === 'object') {
        this.each(function () {
            var self = $(this);
            self.html("<div class=\"minitoggle\"><div class=\"toggle-handle\"></div></div>");
            self.click(function () {
                doToggle(self);
                applyColorOpts(self);
                if (typeof options === 'object' && options.onChange && typeof options.onChange === 'function') {
                    options.onChange();
                }
            });

            if (options["on"]) {
                doToggle(self, options["on"]);
            }
            applyColorOpts(self);
        })
    }
};