<?php

/**
 * @file
 * Default theme implementation to display a block.
 *
 * Available variables:
 * - $block->subject: Block title.
 * - $content: Block content.
 * - $block->module: Module that generated the block.
 * - $block->delta: An ID for the block, unique within each module.
 * - $block->region: The block region embedding the current block.
 * - $classes: String of classes that can be used to style contextually through
 *   CSS. It can be manipulated through the variable $classes_array from
 *   preprocess functions. The default values can be one or more of the
 *   following:
 *   - block: The current template type, i.e., "theming hook".
 *   - block-[module]: The module generating the block. For example, the user
 *     module is responsible for handling the default user navigation block. In
 *     that case the class would be 'block-user'.
 * - $title_prefix (array): An array containing additional output populated by
 *   modules, intended to be displayed in front of the main title tag that
 *   appears in the template.
 * - $title_suffix (array): An array containing additional output populated by
 *   modules, intended to be displayed after the main title tag that appears in
 *   the template.
 *
 * Helper variables:
 * - $classes_array: Array of html class attribute values. It is flattened
 *   into a string within the variable $classes.
 * - $block_zebra: Outputs 'odd' and 'even' dependent on each block region.
 * - $zebra: Same output as $block_zebra but independent of any block region.
 * - $block_id: Counter dependent on each block region.
 * - $id: Same output as $block_id but independent of any block region.
 * - $is_front: Flags true when presented in the front page.
 * - $logged_in: Flags true when the current user is a logged-in member.
 * - $is_admin: Flags true when the current user is an administrator.
 * - $block_html_id: A valid HTML ID and guaranteed unique.
 *
 * @see template_preprocess()
 * @see template_preprocess_block()
 * @see template_process()
 *
 * @ingroup themeable
 */
?>
<div id="<?php print $block_html_id; ?>" class="<?php print $classes; ?>"<?php print $attributes; ?>>

  <?php print render($title_prefix); ?>
<?php if ($block->subject): ?>
  <h2<?php print $title_attributes; ?>><?php print $block->subject ?></h2>
<?php endif;?>
  <?php print render($title_suffix); ?>

  <div class="content"<?php print $content_attributes; ?>>
    <?//php print $content ?>

      <div class="block-footer-bottom">
      	<div class="left">

      	</div>
      	<div class="right">
      		<div class="right-label">
                  <!--<span class="right-label-text">CONTACT US</span>-->
      		</div><!-- end right content -->
            <div class="right-content">
              <div class="right-content-icon">
                                  <img src="<?php print base_path() . path_to_theme() . '/' ?>images/facebook-16x16.png">
                              </div><!-- end right content icon -->
                              <div class="right-content-actual">
                                  <span><a target="_blank" href="http://facebook.com/ApexAirAmbulance">Visit Us on Facebook</a></span>
                              </div><!-- end right content actual -->

              <div class="right-content-icon">
                  <img src="<?php print base_path() . path_to_theme() . '/' ?>images/linkedin-16x16.png">
              </div><!-- end right content icon -->
              <div class="right-content-actual">
                  <span><a target="_blank" href="http://www.linkedin.com/company/apex-air-ambulance">Visit Us on LinkedIn</a></span>
              </div><!-- end right content actual -->

              <div class="right-content-icon">
                  <img src="<?php print base_path() . path_to_theme() . '/' ?>images/google-plus.png">
              </div><!-- end right content icon -->
              <div class="right-content-actual">
                  <span><a target="_blank" href="https://plus.google.com/115394201913745602901">Visit Us on Google+</a></span>
              </div><!-- end right content actual -->

                <div class="right-content-icon">
                    <img src="<?php print base_path() . path_to_theme() . '/' ?>images/footer-icon-1.png">
                </div><!-- end right content icon -->
                <div class="right-content-actual">
                    <span>PO Box 343<br/>Tire Hill, PA 15959</span>
                </div><!-- end right content actual -->
                <div class="right-content-icon">
                    <img src="<?php print base_path() . path_to_theme() . '/' ?>images/footer-icon-2.png">
                </div><!-- end right content icon -->
                <div class="right-content-actual">
                    <span>1-888-970-APEX</span>
                </div><!-- end right content actual -->
                <div class="right-content-icon">
                    <img src="<?php print base_path() . path_to_theme() . '/' ?>images/footer-icon-3.png">
                </div><!-- end right content icon -->
                <div class="right-content-actual">
                    <span><a href="mailto:info@apexairambulance.com">info@apexairambulance.com</a></span>
                </div><!-- end right content actual -->
                <div class="right-content-icon">

               </div><!-- end right content icon -->
               <div class="right-content-actual">
                    <br/>
                	<br/>
                   <span>Website by <a href="http://www.taoti.com?sourceID=apex">Taoti Creative</a>. Built with <a href="http://www.drupal.org" target="_blank">Drupal</a><br/>
                       Aircraft images provided courtesy of Bombardier Inc.</span>
               </div><!-- end right content actual -->

            </div><!-- end right content -->
      	</div> <!-- end right -->
      	<div class="clear"></div>

        <div id="new-logo-box">
          <a href="http://www.cmsa.org/" target="_blank">
            <img style="width: 140px" alt="" src="<?php print base_path() . path_to_theme() . '/' ?>images/CMSA-Logo.png"/>
          </a>
          <a href="http://www.acmaweb.org/" target="_blank">
            <img style="width: 140px; margin-left: 10px; margin-right:10px;" alt="" src="<?php print base_path() . path_to_theme() . '/' ?>images/acma-logo-2.png"/>
          </a>
          <a href="http://www.aams.org/" target="_blank">
            <img style="width: 140px" alt="" src="<?php print base_path() . path_to_theme() . '/' ?>images/AAMS_Logo.png"/>
          </a>
        </div>

      </div>

  </div>
</div>


