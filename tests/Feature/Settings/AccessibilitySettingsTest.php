<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccessibilitySettingsTest extends TestCase
{
    use RefreshDatabase;

    private function animations(): array
    {
        return [
            'bookPickup' => 'fade',
            'bookReturn' => 'full',
            'folderPickup' => 'full',
            'folderReturn' => 'fade',
        ];
    }

    public function test_guests_cannot_read_or_save_accessibility_settings(): void
    {
        $this->get(route('accessibility.edit'))->assertRedirect(route('login'));
        $this->put(route('accessibility.update'), ['animations' => $this->animations()])
            ->assertRedirect(route('login'));
    }

    public function test_accessibility_page_loads_the_signed_in_users_preferences(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['accessibility_settings' => ['animations' => $this->animations()]])->save();

        $this->actingAs($user)->get(route('accessibility.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/accessibility')
                ->where('auth.user.id', $user->id)
                ->where('auth.user.accessibility_settings.animations', $this->animations()));
    }

    public function test_preferences_are_saved_only_for_the_signed_in_account(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['accessibility_settings' => ['other_preference' => true]])->save();
        $other = User::factory()->create();
        $otherSettings = ['animations' => array_fill_keys(array_keys($this->animations()), 'full')];
        $other->forceFill(['accessibility_settings' => $otherSettings])->save();

        $this->actingAs($user)->put(route('accessibility.update'), [
            'animations' => $this->animations(),
            'user_id' => $other->id,
        ])->assertSessionHasNoErrors()->assertRedirect(route('accessibility.edit'));

        $this->assertSame($this->animations(), $user->fresh()->accessibility_settings['animations']);
        $this->assertTrue($user->fresh()->accessibility_settings['other_preference']);
        $this->assertSame($otherSettings, $other->fresh()->accessibility_settings);
    }

    public function test_saved_choices_are_loaded_in_a_new_session_and_other_accounts_stay_separate(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->actingAs($user)->put(route('accessibility.update'), ['animations' => $this->animations()])
            ->assertSessionHasNoErrors();

        $this->flushSession();
        $this->actingAs($other->fresh())->get(route('accessibility.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id', $other->id)
                ->where('auth.user.accessibility_settings', null));

        $this->flushSession();
        $this->actingAs($user->fresh())->get('/archive')
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.accessibility_settings.animations', $this->animations()));
    }

    public function test_invalid_incomplete_or_extra_animation_fields_are_rejected(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        foreach (['invalid', null, 1, ['fade']] as $invalid) {
            $this->put(route('accessibility.update'), [
                'animations' => [...$this->animations(), 'bookPickup' => $invalid],
            ])->assertSessionHasErrors('animations.bookPickup');
            $this->assertNull($user->fresh()->accessibility_settings);
            $this->flushSession();
        }

        $this->put(route('accessibility.update'), ['animations' => ['bookPickup' => 'fade']])
            ->assertSessionHasErrors(['animations.bookReturn', 'animations.folderPickup', 'animations.folderReturn']);
        $this->put(route('accessibility.update'), [
            'animations' => [...$this->animations(), 'extra' => 'fade'],
        ])->assertSessionHasErrors('animations');
        $this->assertNull($user->fresh()->accessibility_settings);
    }

    public function test_the_old_animations_url_redirects_to_accessibility(): void
    {
        $this->actingAs(User::factory()->create())->get('/settings/animations')
            ->assertRedirect(route('accessibility.edit'));
    }
}
