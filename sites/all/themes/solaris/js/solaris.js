//pane-views-latest-projects-block
(function ($) {
    Drupal.behaviors.solaris = {
        attach: function (context, settings) {

            $('.pane-views-latest-projects-block form').hide();
            $('.pane-views-latest-projects-block .jcarousel-item').hover(function () {

                $(this).find('.views-field-title').show('slow')
            }, function () {

                $(this).find('.views-field-title').hide();
            });

            $('#edit-field-portfolio-term-tid').hide();
        }
    };


    $(function () {
        $('.pane-views-latest-projects-block form').hide();
        $('.pane-views-latest-projects-block h2.pane-title').wrap('<div class="block-title-wrapper" />');

        var my_item_list = '<div class="right">';

        $('#edit-field-portfolio-term-tid option').each(function () {
            if ($(this).val() == 'All') {
                my_item_list += '<span><a class="active" rel="' + $(this).val() + '" href="javascript: void(1);">All Projects</a></span>';

            } else {
                my_item_list += '<span><a rel="' + $(this).val() + '" href="javascript: void(1);">' + $(this).html() + '</a></span>';
            }


        });
        my_item_list += '</div><div class="clear"></div>';

        $('.block-title-wrapper').append(my_item_list);
        $('.block-title-wrapper span a').live('click', function () {
            $('.front .view-id-latest_projects').css('overflow', 'hidden');
            $('.block-title-wrapper span a').removeClass('active');
            $(this).addClass('active');
            $('#edit-field-portfolio-term-tid').val($(this).attr('rel')).change();

        });

        $('#search-block-form input.form-text').attr('placeholder', 'Searching for something?');
        $(' [placeholder] ').defaultValue();


        if ($("#solaris-page-title").length) {
            $('h1#page-title').hide();
        }


        /** portfolio */
        var selector = '#edit-field-portfolio-term-tid';
        var portfolio_list = select_list_to_item_list(selector);
        $(selector).hide();

        $('.view-portfolio').before('<div class="category-list">' + portfolio_list + '</div>');
        $('.category-list a').live('click', function () {

            $('.category-list a').removeClass('active');
            $(this).addClass('active');

            $('#edit-field-portfolio-term-tid').change();
        });

        /* end portofio */


        //active menu item
        if ($('.node.node-blog.view-mode-full').length) {
            $('.main-menu a').each(function () {
                if ($(this).attr('href') == '/blog') {
                    $(this).addClass('active');
                }

            });


        }
        //active portfolio item

        if ($('.node.node-portfolio.view-mode-full').length) {
            $('.main-menu a').each(function () {
                if ($(this).attr('href') == '/portfolio') {
                    $(this).addClass('active');
                }

            });


        }


        // portfolio filter


        $('.view-portfolio .views-row').each(function () {

            $(this).addClass($(this).find('.term-class').html());

        });

        $('#edit-field-portfolio-term-tid-wrapper .form-item .form-item').each(function () {
            $(this).find('a').attr('data-filter', '.' + $(this).attr('id'));

        });

        $('#edit-field-portfolio-term-tid-all').html('<a class="active" data-filter="*" href="/portfolio">All</a>');

        var $container = $('.view-portfolio .view-content');
        // initialize isotope
        $container.isotope({
            // options...
        });


        // filter items when filter link is clicked
        $('#edit-field-portfolio-term-tid-wrapper a').click(function () {
            var selector = $(this).attr('data-filter');
            $('#edit-field-portfolio-term-tid-wrapper a').removeClass('active');
            $(this).addClass('active');
            $container.isotope({
                filter: selector
            });
            return false;
        });


        // end portfolio


    });


    function select_list_to_item_list(selector) {
        //edit-field-portfolio-term-tid
        selectId = $(selector);
        var my_item_list = '<ul>';
        selectId.find('option').each(function () {
            if ($(this).val() == 'All') {
                my_item_list += '<li><a class="active" rel="' + $(this).val() + '" href="javascript: void(1);">All Projects</a></li>';

            } else {
                my_item_list += '<li><a rel="' + $(this).val() + '" href="javascript: void(1);">' + $(this).html() + '</a></li>';
            }

        });

        my_item_list += '</ul>';


        return my_item_list;


    }

    //$('.block-about .inner')


})(jQuery);


jQuery(document).ready(function() {
    // Open Form in Popup

    // "colorbox-inline" to the link and build the url like this "?width=500&height=500&inline=true#id-of-content".

    jQuery("a.update-link-to-contact").each(function() {
        thishref = jQuery(this).attr('href');

        jQuery(this).attr('href',"?width=700&height=900&inline=true#block-webform-client-block-45");

    });

    jQuery("a.update-link-to-request").each(function() {
        jQuery(this).attr('href',"?width=700&height=900&inline=true#block-webform-client-block-44");
    });


    jQuery('.webform-block-custom-css .required.error').on('focus', function() {
       jQuery(this).removeClass('error');
    });

});