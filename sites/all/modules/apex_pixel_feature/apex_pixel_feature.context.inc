<?php
/**
 * @file
 * apex_pixel_feature.context.inc
 */

/**
 * Implements hook_context_default_contexts().
 */
function apex_pixel_feature_context_default_contexts() {
  $export = array();

  $context = new stdClass();
  $context->disabled = FALSE; /* Edit this to true to make a default context disabled initially */
  $context->api_version = 3;
  $context->name = 'pixel_case_manager';
  $context->description = 'This places the pixel for the case manager';
  $context->tag = 'Pixel';
  $context->conditions = array(
    'path' => array(
      'values' => array(
        '<front>' => '<front>',
        'node/30' => 'node/30',
      ),
    ),
  );
  $context->reactions = array(
    'block' => array(
      'blocks' => array(
        'apex_pixel-pixel_case_manager' => array(
          'module' => 'apex_pixel',
          'delta' => 'pixel_case_manager',
          'region' => 'content',
          'weight' => '-10',
        ),
      ),
    ),
  );
  $context->condition_mode = 0;

  // Translatables
  // Included for use with string extractors like potx.
  t('Pixel');
  t('This places the pixel for the case manager');
  $export['pixel_case_manager'] = $context;

  $context = new stdClass();
  $context->disabled = FALSE; /* Edit this to true to make a default context disabled initially */
  $context->api_version = 3;
  $context->name = 'pixel_medical_escort';
  $context->description = 'Pixel placement for the medical escort';
  $context->tag = 'Pixel';
  $context->conditions = array(
    'path' => array(
      'values' => array(
        'node/32' => 'node/32',
      ),
    ),
  );
  $context->reactions = array(
    'block' => array(
      'blocks' => array(
        'apex_pixel-pixel_medical_escort' => array(
          'module' => 'apex_pixel',
          'delta' => 'pixel_medical_escort',
          'region' => 'content',
          'weight' => '-10',
        ),
      ),
    ),
  );
  $context->condition_mode = 0;

  // Translatables
  // Included for use with string extractors like potx.
  t('Pixel');
  t('Pixel placement for the medical escort');
  $export['pixel_medical_escort'] = $context;

  return $export;
}
