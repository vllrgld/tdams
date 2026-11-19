<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'ocr' => [
        'local' => [
            'url' => env('OCR_URL', 'http://127.0.0.1:8001'),
            'token' => env('OCR_TOKEN'),
            'timeout' => (int) env('OCR_TIMEOUT', 300),
        ],
        'paddle' => [
            'job_url' => env('PADDLE_OCR_JOB_URL', 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs'),
            'token' => env('PADDLE_OCR_TOKEN'),
            'model' => env('PADDLE_OCR_MODEL', 'PP-OCRv6'),
        ],
    ],

    'groq' => [
        'url' => env('GROQ_URL', 'https://api.groq.com/openai/v1'),
        'key' => env('GROQ_API_KEY'),
        'models' => [env('GROQ_MODEL', 'openai/gpt-oss-120b')],
        'timeout' => (int) env('GROQ_TIMEOUT', 180),
        'max_tokens' => (int) env('GROQ_MAX_TOKENS', 4096),
    ],

];
