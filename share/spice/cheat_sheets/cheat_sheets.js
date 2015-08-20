// DDH.cheat_sheets = DDH.cheat_sheets || {};

// DDH.cheat_sheets.build = function(ops) {

function ddg_spice_cheat_sheets(apiResult) {
    if (!apiResult || apiResult.response.numFound !== 1) {
        return Spice.failed("cheat_sheets");
    }

    Spice.registerHelper('cheatsheets_ordered', function(sections, section_order, template_type, options) {
        var result = "";
        var template = {
          type: template_type,
          path: template_type ? 'DDH.cheat_sheets.' + template_type : 'DDH.cheat_sheets.keyboard'
        };

        $.each(section_order, function(i, section) {
           if (sections[section]){

               var showhide = true;

               if (i === 0 ){
                   showhide = false;
               } else if ( i === 1 && !is_mobile ){
                   showhide = false;
               }

               result += options.fn({ name: section, items: sections[section], template: template, showhide: showhide });
            }
        });
        return result;
    });

    var re_brackets    = /(?:\[|\{|\}|\])/,      // search for [, {, }, or }
        re_whitespace  = /\s+/,                  // search for spaces
        re_codeblock   = /<code>(.+?)<\/code>/g; // search for <code></code>

    Spice.registerHelper('cheatsheets_codeblock', function(string, className, options) {

        var out;
        var codeClass = typeof className === "string" ? className : "bg-clr--white";
        
        // replace escaped slashes and brackets
        string = string.replace(/\\\\/, "<bks>")
                .replace(/\\\[/g, "<lbr>")
                .replace(/\\\{/g, "<lcbr>")
                .replace(/\\\]/g, "<rbr>")
                .replace(/\\\}/g, "<rcbr>");

        // no spaces
        // OR
        // spaces and no un-escaped brackets
        // e.g "?()", ":sp filename"
        //  --> wrap whole sting in <code></code>
        if ( !re_whitespace.test(string) || !re_brackets.test(string) ){
            out = "<code class='"+codeClass+"'>" + string + "</code>";

        // spaces
        // AND
        // un-escaped brackets
        // e.g "[Ctrl] [B]"
        //  --> replace [] & {} with <code></code>
        } else {

            // replace unescaped brackets
            out = string
                .replace(/\[|\{/g, "<code class='"+codeClass+"'>")
                .replace(/\]|\}/g, "</code>");
        }

        out = out
                // re-replace escaped slash
                .replace(/<bks>/g,  "\\")
                // re-replace escaped brackets
                .replace(/<lbr>/g,  "[")
                .replace(/<lcbr>/g, "{")
                .replace(/<rbr>/g,  "]")
                .replace(/<rcbr>/g, "}");

        out = out.replace(re_codeblock, function esc_codeblock (match, p1, offset, string, codeClass){
            var escaped = Handlebars.Utils.escapeExpression(p1);
            return "<code class='"+codeClass+">" + escaped + "</code>";
        });

        return new Handlebars.SafeString(out);
    });

    var wasShown = false; // keep track whether onShow was run yet

    Spice.add({
        id: "cheat_sheets",
        name: "Cheat Sheet",
        data: JSON.parse(apiResult.response.docs[0].paragraph),
        templates: {
            group: "base",
            item: null,
            options: {
                content: Spice.cheat_sheets.detail,
                moreAt: 0
            }
        },
        onShow: function() {
            // make sure this function is only run once, the first time
            // the IA is shown otherwise things will get initialized more than once
            if (wasShown) { return; }

            // set the flag to true so it doesn't get run again:
            wasShown = true;

            var $dom = $("#zci-cheat_sheets"),
                $container = $dom.find(".cheatsheet__container"),
                $detail    = $dom.find(".zci__main--detail"),
                $section   = $dom.find(".cheatsheet__section"),
                $hideRow   = $section.find("tbody tr:nth-child(n+4), ul li:nth-child(n+4)"),
                $showhide  = $container.find(".cheatsheet__section.showhide"),
                $more_btn  = $dom.find(".chomp--link"),
                isExpanded = false,
                loadedMasonry = false,
                masonryOps = {
                    itemSelector: '.cheatsheet__section',
                    columnWidth: 295,
                    gutter: 30,
                    isFitWidth: true
                },
                showMoreLess = function() {

                    // keep track of whether it's expanded or not:
                    isExpanded = !isExpanded;

                    // update the querystring param so the state
                    // persists across page refreshes or if the link
                    // is shared to someone else:
                    if (isExpanded) {
                        DDG.history.set({ iax: 1 });
                    } else {
                        DDG.history.clear('iax');
                    }

                    $dom.toggleClass("has-chomp-expanded");
                    $detail.toggleClass("c-base");
                    $container.toggleClass("compressed");
                    $showhide.toggleClass("is-hidden");
                    $hideRow.toggleClass("is-hidden");

                    if (window.Masonry) {
                        $container.masonry(masonryOps);
                    }
                };

            // Removes all tr's after the 3rd before masonry fires
            if ($container.hasClass("compressed")) {
              $hideRow.toggleClass("is-hidden");
            }
            // if iax=1 is in the querystring, expand
            // the cheatsheet automatically when the IA is shown:
            if (DDG.history.get('iax')) {
                showMoreLess();
            }

            DDG.require('masonry.js', function(){
                $container.masonry(masonryOps);
                $more_btn.click(showMoreLess);
            });
         }

    });
}
