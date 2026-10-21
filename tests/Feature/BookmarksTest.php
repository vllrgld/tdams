<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookmarksTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('bookmarks.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_bookmarks()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('bookmarks.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page->component('bookmarks/index'));
    }
}
