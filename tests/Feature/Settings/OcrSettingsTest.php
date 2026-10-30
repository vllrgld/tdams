<?php

namespace Tests\Feature\Settings;

use App\Models\OcrSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
            ->where('model', OcrSetting::DEFAULT_MODEL)
            ->where('optimize', 3)
            ->has('drivers', 2)
            ->has('models', 2)
            ->where('models.0.value', OcrSetting::MODEL_TRADITIONAL)
            ->where('models.1.value', OcrSetting::MODEL_VL)
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
                'model' => OcrSetting::MODEL_VL,
                'optimize' => 3,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('ocr.edit'));

        $setting = OcrSetting::current();
        $this->assertSame('paddle', $setting->driver);
        $this->assertNull($setting->job_url);
        $this->assertNull($setting->token);
        $this->assertSame(OcrSetting::MODEL_VL, $setting->model);
    }

    public function test_saving_a_paddle_model_keeps_the_existing_token_and_clears_a_custom_job_url(): void
    {
        $user = User::factory()->create();
        OcrSetting::current()->forceFill([
            'driver' => 'paddle',
            'job_url' => 'https://example.test/jobs',
            'token' => 'existing-token',
            'model' => OcrSetting::MODEL_TRADITIONAL,
        ])->save();

        $this->actingAs($user)
            ->put(route('ocr.update'), [
                'driver' => 'paddle',
                'model' => OcrSetting::MODEL_TRADITIONAL,
                'optimize' => 3,
            ])
            ->assertSessionHasNoErrors();

        $setting = OcrSetting::current();
        $this->assertNull($setting->job_url);
        $this->assertSame('existing-token', $setting->token);
        $this->assertSame(OcrSetting::MODEL_TRADITIONAL, $setting->model);
    }

    public function test_paddle_rejects_an_unknown_model(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('ocr.edit'))
            ->put(route('ocr.update'), [
                'driver' => 'paddle',
                'model' => 'not-a-model',
                'optimize' => 3,
            ])
            ->assertSessionHasErrors('model');
    }

    public function test_paddle_model_is_required(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('ocr.edit'))
            ->put(route('ocr.update'), [
                'driver' => 'paddle',
                'optimize' => 3,
            ])
            ->assertSessionHasErrors('model');
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
