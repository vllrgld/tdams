<?php

namespace Tests\Feature\Settings;

use App\Models\OcrSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OcrSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_ocr_page_lists_engines_and_levels(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('ocr.edit'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('settings/ocr')
            ->where('driver', 'local')
            ->where('hasToken', false)
            ->where('jobUrl', OcrSetting::DEFAULT_JOB_URL)
            ->where('model', OcrSetting::DEFAULT_MODEL)
            ->where('optimize', 3)
            ->has('drivers', 2)
            ->has('levels', 4));
    }

    public function test_compression_url_redirects_to_ocr_settings(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/settings/compression')
            ->assertRedirect('/settings/ocr');
    }

    public function test_local_engine_and_compression_level_can_be_saved(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->put(route('ocr.update'), [
                'driver' => 'local',
                'optimize' => 1,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('ocr.edit'));

        $setting = OcrSetting::current();
        $this->assertSame('local', $setting->driver);
        $this->assertSame(1, $setting->optimize);
    }

    public function test_paddle_engine_settings_can_be_saved(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->put(route('ocr.update'), [
                'driver' => 'paddle',
                'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
                'token' => 'paddle-test-token',
                'model' => 'PP-OCRv6',
                'optimize' => 3,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('ocr.edit'));

        $setting = OcrSetting::current();
        $this->assertSame('paddle', $setting->driver);
        $this->assertSame('https://paddleocr.aistudio-app.com/api/v2/ocr/jobs', $setting->job_url);
        $this->assertSame('paddle-test-token', $setting->token);
        $this->assertSame('PP-OCRv6', $setting->model);
    }

    public function test_blank_paddle_token_keeps_the_saved_token(): void
    {
        $user = User::factory()->create();
        OcrSetting::current()->forceFill([
            'driver' => 'paddle',
            'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
            'token' => 'existing-token',
            'model' => 'PP-OCRv6',
        ])->save();

        $this->actingAs($user)
            ->put(route('ocr.update'), [
                'driver' => 'paddle',
                'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
                'token' => '',
                'model' => 'PP-OCRv6',
                'optimize' => 3,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('existing-token', OcrSetting::current()->token);
    }

    public function test_paddle_requires_a_token_when_none_is_saved(): void
    {
        $user = User::factory()->create();
        Config::set('services.ocr.paddle.token', '');

        $this->actingAs($user)
            ->from(route('ocr.edit'))
            ->put(route('ocr.update'), [
                'driver' => 'paddle',
                'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
                'model' => 'PP-OCRv6',
                'optimize' => 3,
            ])
            ->assertSessionHasErrors('token');
    }

    public function test_paddle_can_be_enabled_using_the_env_token(): void
    {
        $user = User::factory()->create();
        Config::set('services.ocr.paddle.token', 'env-paddle-token');

        $this->actingAs($user)
            ->put(route('ocr.update'), [
                'driver' => 'paddle',
                'job_url' => 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
                'token' => '',
                'model' => 'PP-OCRv6',
                'optimize' => 3,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('ocr.edit'));

        $this->assertSame('paddle', OcrSetting::current()->driver);
    }

    public function test_compression_level_must_be_between_zero_and_three(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from(route('ocr.edit'))
            ->put(route('ocr.update'), [
                'driver' => 'local',
                'optimize' => 9,
            ]);

        $response->assertSessionHasErrors('optimize');
        $this->assertSame(3, OcrSetting::current()->optimize);
    }
}
