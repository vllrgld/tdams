<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookmarksTest extends TestCase
{
    use RefreshDatabase;

    public function test_bookmarks_page_is_unavailable_to_guests(): void
    {
        $this->get('/bookmarks')->assertNotFound();
    }

    public function test_bookmarks_page_is_unavailable_to_authenticated_users(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get('/bookmarks')->assertNotFound();
    }
}
