<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Policy;
use App\Models\User;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class PolicyTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function anyone_can_view_all_policies()
    {
        Policy::factory()->count(3)->create();

        $response = $this->getJson('/api/policies');

        $response->assertStatus(200)
                 ->assertJsonStructure([[
                     'id',
                     'type',
                     'title',
                     'content',
                     'created_at',
                     'updated_at'
                 ]]);
    }

    /** @test */
    public function anyone_can_view_policy_by_type()
    {
        $policy = Policy::factory()->create(['type' => 'privacy']);

        $response = $this->getJson('/api/policies/privacy');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'policy' => [
                         'type' => 'privacy',
                     ],
                 ]);
    }

    /** @test */
    public function admin_can_update_policy()
{
    // Create an admin user
    $user = User::factory()->create(['role' => 'admin']);

    // Generate a real JWT token for this admin
    $token = auth('api')->login($user);

    // Create a sample policy
    $policy = Policy::factory()->create(['title' => 'Old Title']);

    // Send PUT request with the Bearer token
    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/policies/{$policy->id}", [
            'title' => 'Updated Policy Title',
            'content' => 'Updated content.',
        ]);

    $response->assertStatus(200)
             ->assertJson(['success' => true]);

    $this->assertEquals('Updated Policy Title', $policy->fresh()->title);
}

}
