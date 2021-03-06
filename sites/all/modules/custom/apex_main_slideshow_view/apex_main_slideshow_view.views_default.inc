<?php
/**
 * @file
 * apex_main_slideshow_view.views_default.inc
 */

/**
 * Implements hook_views_default_views().
 */
function apex_main_slideshow_view_views_default_views() {
  $export = array();

  $view = new view();
  $view->name = 'main_slideshow';
  $view->description = '';
  $view->tag = 'default';
  $view->base_table = 'node';
  $view->human_name = 'Main Slideshow';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'some';
  $handler->display->display_options['pager']['options']['items_per_page'] = '10';
  $handler->display->display_options['style_plugin'] = 'slideshow';
  $handler->display->display_options['style_options']['flexslider_views_slideshow']['caption_field'] = 'none';
  $handler->display->display_options['style_options']['slideshow_type'] = 'flexslider_views_slideshow';
  $handler->display->display_options['style_options']['slideshow_skin'] = 'default';
  $handler->display->display_options['style_options']['skin_info'] = array(
    'class' => 'default',
    'name' => 'Default',
    'module' => 'views_slideshow',
    'path' => '',
    'stylesheets' => array(),
  );
  $handler->display->display_options['style_options']['widgets']['top']['views_slideshow_pager']['weight'] = '1';
  $handler->display->display_options['style_options']['widgets']['top']['views_slideshow_pager']['type'] = 'views_slideshow_pager_fields';
  $handler->display->display_options['style_options']['widgets']['top']['views_slideshow_pager']['views_slideshow_pager_fields_fields'] = array(
    'title' => 0,
    'body' => 0,
    'field_slideshow_image' => 0,
    'nothing' => 0,
  );
  $handler->display->display_options['style_options']['widgets']['top']['views_slideshow_controls']['weight'] = '1';
  $handler->display->display_options['style_options']['widgets']['top']['views_slideshow_controls']['type'] = 'views_slideshow_controls_text';
  $handler->display->display_options['style_options']['widgets']['top']['views_slideshow_slide_counter']['weight'] = '1';
  $handler->display->display_options['style_options']['widgets']['bottom']['views_slideshow_pager']['weight'] = '1';
  $handler->display->display_options['style_options']['widgets']['bottom']['views_slideshow_pager']['type'] = 'views_slideshow_pager_fields';
  $handler->display->display_options['style_options']['widgets']['bottom']['views_slideshow_pager']['views_slideshow_pager_fields_fields'] = array(
    'title' => 0,
    'body' => 0,
    'field_slideshow_image' => 0,
    'nothing' => 0,
  );
  $handler->display->display_options['style_options']['widgets']['bottom']['views_slideshow_controls']['weight'] = '1';
  $handler->display->display_options['style_options']['widgets']['bottom']['views_slideshow_controls']['type'] = 'views_slideshow_controls_text';
  $handler->display->display_options['style_options']['widgets']['bottom']['views_slideshow_slide_counter']['weight'] = '1';
  $handler->display->display_options['style_options']['views_slideshow_cycle']['timeout'] = '5000';
  $handler->display->display_options['style_options']['views_slideshow_cycle']['speed'] = '700';
  $handler->display->display_options['style_options']['views_slideshow_cycle']['delay'] = '0';
  $handler->display->display_options['style_options']['views_slideshow_cycle']['start_paused'] = 0;
  $handler->display->display_options['style_options']['views_slideshow_cycle']['remember_slide_days'] = '1';
  $handler->display->display_options['style_options']['views_slideshow_cycle']['items_per_slide'] = '1';
  $handler->display->display_options['style_options']['views_slideshow_cycle']['wait_for_image_load_timeout'] = '3000';
  $handler->display->display_options['style_options']['views_slideshow_cycle']['cleartype'] = 0;
  $handler->display->display_options['style_options']['views_slideshow_cycle']['cleartypenobg'] = 0;
  $handler->display->display_options['row_plugin'] = 'fields';
  /* Field: Content: Text */
  $handler->display->display_options['fields']['field_text']['id'] = 'field_text';
  $handler->display->display_options['fields']['field_text']['table'] = 'field_data_field_text';
  $handler->display->display_options['fields']['field_text']['field'] = 'field_text';
  $handler->display->display_options['fields']['field_text']['label'] = '';
  $handler->display->display_options['fields']['field_text']['exclude'] = TRUE;
  $handler->display->display_options['fields']['field_text']['element_type'] = '0';
  $handler->display->display_options['fields']['field_text']['element_class'] = 'slideshow-text';
  $handler->display->display_options['fields']['field_text']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_text']['element_wrapper_type'] = '0';
  $handler->display->display_options['fields']['field_text']['element_default_classes'] = FALSE;
  $handler->display->display_options['fields']['field_text']['field_api_classes'] = TRUE;
  /* Field: Content: Request quote link */
  $handler->display->display_options['fields']['field_request_quote_link']['id'] = 'field_request_quote_link';
  $handler->display->display_options['fields']['field_request_quote_link']['table'] = 'field_data_field_request_quote_link';
  $handler->display->display_options['fields']['field_request_quote_link']['field'] = 'field_request_quote_link';
  $handler->display->display_options['fields']['field_request_quote_link']['label'] = '';
  $handler->display->display_options['fields']['field_request_quote_link']['exclude'] = TRUE;
  $handler->display->display_options['fields']['field_request_quote_link']['element_type'] = '0';
  $handler->display->display_options['fields']['field_request_quote_link']['element_class'] = 'slideButtonleft';
  $handler->display->display_options['fields']['field_request_quote_link']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_request_quote_link']['element_wrapper_type'] = '0';
  $handler->display->display_options['fields']['field_request_quote_link']['element_default_classes'] = FALSE;
  $handler->display->display_options['fields']['field_request_quote_link']['click_sort_column'] = 'url';
  $handler->display->display_options['fields']['field_request_quote_link']['field_api_classes'] = TRUE;
  /* Field: Content: Title */
  $handler->display->display_options['fields']['title']['id'] = 'title';
  $handler->display->display_options['fields']['title']['table'] = 'node';
  $handler->display->display_options['fields']['title']['field'] = 'title';
  $handler->display->display_options['fields']['title']['label'] = '';
  $handler->display->display_options['fields']['title']['exclude'] = TRUE;
  $handler->display->display_options['fields']['title']['alter']['word_boundary'] = FALSE;
  $handler->display->display_options['fields']['title']['alter']['ellipsis'] = FALSE;
  $handler->display->display_options['fields']['title']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['title']['link_to_node'] = FALSE;
  /* Field: Content: Body */
  $handler->display->display_options['fields']['body']['id'] = 'body';
  $handler->display->display_options['fields']['body']['table'] = 'field_data_body';
  $handler->display->display_options['fields']['body']['field'] = 'body';
  $handler->display->display_options['fields']['body']['label'] = '';
  $handler->display->display_options['fields']['body']['exclude'] = TRUE;
  $handler->display->display_options['fields']['body']['alter']['max_length'] = '400';
  $handler->display->display_options['fields']['body']['alter']['word_boundary'] = FALSE;
  $handler->display->display_options['fields']['body']['alter']['trim'] = TRUE;
  $handler->display->display_options['fields']['body']['alter']['html'] = TRUE;
  $handler->display->display_options['fields']['body']['element_label_colon'] = FALSE;
  /* Field: Content: Image */
  $handler->display->display_options['fields']['field_slideshow_image']['id'] = 'field_slideshow_image';
  $handler->display->display_options['fields']['field_slideshow_image']['table'] = 'field_data_field_slideshow_image';
  $handler->display->display_options['fields']['field_slideshow_image']['field'] = 'field_slideshow_image';
  $handler->display->display_options['fields']['field_slideshow_image']['label'] = '';
  $handler->display->display_options['fields']['field_slideshow_image']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_slideshow_image']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_slideshow_image']['settings'] = array(
    'image_style' => 'flexslider_full',
    'image_link' => '',
  );
  /* Field: Content: Slideshow Link */
  $handler->display->display_options['fields']['field_slideshow_link']['id'] = 'field_slideshow_link';
  $handler->display->display_options['fields']['field_slideshow_link']['table'] = 'field_data_field_slideshow_link';
  $handler->display->display_options['fields']['field_slideshow_link']['field'] = 'field_slideshow_link';
  $handler->display->display_options['fields']['field_slideshow_link']['label'] = '';
  $handler->display->display_options['fields']['field_slideshow_link']['exclude'] = TRUE;
  $handler->display->display_options['fields']['field_slideshow_link']['element_type'] = '0';
  $handler->display->display_options['fields']['field_slideshow_link']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_slideshow_link']['element_wrapper_type'] = '0';
  $handler->display->display_options['fields']['field_slideshow_link']['element_default_classes'] = FALSE;
  $handler->display->display_options['fields']['field_slideshow_link']['click_sort_column'] = 'url';
  $handler->display->display_options['fields']['field_slideshow_link']['field_api_classes'] = TRUE;
  /* Field: Global: Custom text */
  $handler->display->display_options['fields']['nothing']['id'] = 'nothing';
  $handler->display->display_options['fields']['nothing']['table'] = 'views';
  $handler->display->display_options['fields']['nothing']['field'] = 'nothing';
  $handler->display->display_options['fields']['nothing']['label'] = '';
  $handler->display->display_options['fields']['nothing']['alter']['text'] = '<div class="slideshow-description-wrapper">
<div class="slideshow-text">[field_text]</div>
<div class="slideButton-left">[field_request_quote_link]</div>
<div class="slideshow-description-inner">
<div class="slide-title"><h2>[title]</h2></div>
<div class="slide-description">
[body]
</br>
<div class="slideButton">[field_slideshow_link]</div>
</div>
</div>
</div>';
  $handler->display->display_options['fields']['nothing']['element_label_colon'] = FALSE;
  /* Sort criterion: Content: Post date */
  $handler->display->display_options['sorts']['created']['id'] = 'created';
  $handler->display->display_options['sorts']['created']['table'] = 'node';
  $handler->display->display_options['sorts']['created']['field'] = 'created';
  $handler->display->display_options['sorts']['created']['order'] = 'DESC';
  /* Filter criterion: Content: Published */
  $handler->display->display_options['filters']['status']['id'] = 'status';
  $handler->display->display_options['filters']['status']['table'] = 'node';
  $handler->display->display_options['filters']['status']['field'] = 'status';
  $handler->display->display_options['filters']['status']['value'] = 1;
  $handler->display->display_options['filters']['status']['group'] = 1;
  $handler->display->display_options['filters']['status']['expose']['operator'] = FALSE;
  /* Filter criterion: Content: Type */
  $handler->display->display_options['filters']['type']['id'] = 'type';
  $handler->display->display_options['filters']['type']['table'] = 'node';
  $handler->display->display_options['filters']['type']['field'] = 'type';
  $handler->display->display_options['filters']['type']['value'] = array(
    'slideshow' => 'slideshow',
  );

  /* Display: Slideshow Block */
  $handler = $view->new_display('block', 'Slideshow Block', 'block');
  $handler->display->display_options['defaults']['fields'] = FALSE;
  /* Field: Content: Text */
  $handler->display->display_options['fields']['field_text']['id'] = 'field_text';
  $handler->display->display_options['fields']['field_text']['table'] = 'field_data_field_text';
  $handler->display->display_options['fields']['field_text']['field'] = 'field_text';
  $handler->display->display_options['fields']['field_text']['label'] = '';
  $handler->display->display_options['fields']['field_text']['exclude'] = TRUE;
  $handler->display->display_options['fields']['field_text']['element_type'] = '0';
  $handler->display->display_options['fields']['field_text']['element_class'] = 'slideshow-text';
  $handler->display->display_options['fields']['field_text']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_text']['element_wrapper_type'] = '0';
  $handler->display->display_options['fields']['field_text']['element_default_classes'] = FALSE;
  $handler->display->display_options['fields']['field_text']['field_api_classes'] = TRUE;
  /* Field: Content: Request quote link */
  $handler->display->display_options['fields']['field_request_quote_link']['id'] = 'field_request_quote_link';
  $handler->display->display_options['fields']['field_request_quote_link']['table'] = 'field_data_field_request_quote_link';
  $handler->display->display_options['fields']['field_request_quote_link']['field'] = 'field_request_quote_link';
  $handler->display->display_options['fields']['field_request_quote_link']['label'] = '';
  $handler->display->display_options['fields']['field_request_quote_link']['exclude'] = TRUE;
  $handler->display->display_options['fields']['field_request_quote_link']['element_type'] = '0';
  $handler->display->display_options['fields']['field_request_quote_link']['element_class'] = 'slideButtonleft';
  $handler->display->display_options['fields']['field_request_quote_link']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_request_quote_link']['element_wrapper_type'] = '0';
  $handler->display->display_options['fields']['field_request_quote_link']['element_default_classes'] = FALSE;
  $handler->display->display_options['fields']['field_request_quote_link']['click_sort_column'] = 'url';
  $handler->display->display_options['fields']['field_request_quote_link']['field_api_classes'] = TRUE;
  /* Field: Content: Title */
  $handler->display->display_options['fields']['title']['id'] = 'title';
  $handler->display->display_options['fields']['title']['table'] = 'node';
  $handler->display->display_options['fields']['title']['field'] = 'title';
  $handler->display->display_options['fields']['title']['label'] = '';
  $handler->display->display_options['fields']['title']['exclude'] = TRUE;
  $handler->display->display_options['fields']['title']['alter']['word_boundary'] = FALSE;
  $handler->display->display_options['fields']['title']['alter']['ellipsis'] = FALSE;
  $handler->display->display_options['fields']['title']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['title']['link_to_node'] = FALSE;
  /* Field: Content: Body */
  $handler->display->display_options['fields']['body']['id'] = 'body';
  $handler->display->display_options['fields']['body']['table'] = 'field_data_body';
  $handler->display->display_options['fields']['body']['field'] = 'body';
  $handler->display->display_options['fields']['body']['label'] = '';
  $handler->display->display_options['fields']['body']['exclude'] = TRUE;
  $handler->display->display_options['fields']['body']['alter']['max_length'] = '400';
  $handler->display->display_options['fields']['body']['alter']['word_boundary'] = FALSE;
  $handler->display->display_options['fields']['body']['alter']['trim'] = TRUE;
  $handler->display->display_options['fields']['body']['alter']['html'] = TRUE;
  $handler->display->display_options['fields']['body']['element_label_colon'] = FALSE;
  /* Field: Content: Image */
  $handler->display->display_options['fields']['field_slideshow_image']['id'] = 'field_slideshow_image';
  $handler->display->display_options['fields']['field_slideshow_image']['table'] = 'field_data_field_slideshow_image';
  $handler->display->display_options['fields']['field_slideshow_image']['field'] = 'field_slideshow_image';
  $handler->display->display_options['fields']['field_slideshow_image']['label'] = '';
  $handler->display->display_options['fields']['field_slideshow_image']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_slideshow_image']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_slideshow_image']['settings'] = array(
    'image_style' => 'flexslider_full',
    'image_link' => '',
  );
  /* Field: Content: Slideshow Link */
  $handler->display->display_options['fields']['field_slideshow_link']['id'] = 'field_slideshow_link';
  $handler->display->display_options['fields']['field_slideshow_link']['table'] = 'field_data_field_slideshow_link';
  $handler->display->display_options['fields']['field_slideshow_link']['field'] = 'field_slideshow_link';
  $handler->display->display_options['fields']['field_slideshow_link']['label'] = '';
  $handler->display->display_options['fields']['field_slideshow_link']['exclude'] = TRUE;
  $handler->display->display_options['fields']['field_slideshow_link']['element_type'] = '0';
  $handler->display->display_options['fields']['field_slideshow_link']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_slideshow_link']['element_wrapper_type'] = '0';
  $handler->display->display_options['fields']['field_slideshow_link']['element_default_classes'] = FALSE;
  $handler->display->display_options['fields']['field_slideshow_link']['click_sort_column'] = 'url';
  $handler->display->display_options['fields']['field_slideshow_link']['field_api_classes'] = TRUE;
  /* Field: Global: Custom text */
  $handler->display->display_options['fields']['nothing']['id'] = 'nothing';
  $handler->display->display_options['fields']['nothing']['table'] = 'views';
  $handler->display->display_options['fields']['nothing']['field'] = 'nothing';
  $handler->display->display_options['fields']['nothing']['label'] = '';
  $handler->display->display_options['fields']['nothing']['alter']['text'] = '<div class="slideshow-description-wrapper">
<div class="slideshow-text">[field_text]</div>
<div class="slideButton-left"><a class="colorbox-inline" href="?width=700&height=700&inline=true#block-webform-client-block-44">Request a Quote Now</a></div>
<div class="slideshow-description-inner">
<div class="slide-title"><h2>[title]</h2></div>
<div class="slide-description">
[body]
</br>
<div class="slideButton">[field_slideshow_link]</div>
</div>
</div>
</div>';
  $handler->display->display_options['fields']['nothing']['element_label_colon'] = FALSE;
  $export['main_slideshow'] = $view;

  return $export;
}
