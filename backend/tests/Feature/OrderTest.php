<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Events\OrderPlaced;
use App\Models\{Cart, MenuItem, User, StoreSetting};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Carbon\Carbon;

class OrderTest extends TestCase {
    use RefreshDatabase;

    public function test_order_places_and_deducts_stock() {
        Event::fake();
        $user = User::factory()->create(['role'=>'customer']);
        $item = MenuItem::factory()->create(['stock'=>5,'price'=>100]);
        Cart::create(['user_id'=>$user->id,'menu_item_id'=>$item->id,'quantity'=>2,'price'=>100]);
        StoreSetting::create(['is_open'=>true,'timezone'=>'Asia/Manila']);

        $res = $this->actingAs($user,'api')->postJson('/api/order',['order_type'=>'take-out']);
        $res->assertStatus(200);
        $this->assertEquals(3,$item->fresh()->stock);
        Event::assertDispatched(OrderPlaced::class);
    }

    public function test_order_fails_when_store_closed() {
        $user = User::factory()->create(['role'=>'customer']);
        StoreSetting::create(['is_open'=>false,'timezone'=>'Asia/Manila']);
        $res = $this->actingAs($user,'api')->postJson('/api/order',['order_type'=>'take-out']);
        $res->assertStatus(400)->assertJson(['message'=>'Store is closed']);
    }

    public function test_stock_rolls_back_on_failure() {
        $user = User::factory()->create(['role'=>'customer']);
        $item = MenuItem::factory()->create(['stock'=>1]);
        Cart::create(['user_id'=>$user->id,'menu_item_id'=>$item->id,'quantity'=>2,'price'=>100]);
        StoreSetting::create(['is_open'=>true,'timezone'=>'Asia/Manila']);

        $res = $this->actingAs($user,'api')->postJson('/api/order',['order_type'=>'take-out']);
        $res->assertStatus(400);
        $this->assertEquals(1,$item->fresh()->stock);
    }

    public function test_invalid_pickup_time_is_rejected() {
        $user = User::factory()->create(['role'=>'customer']);
        StoreSetting::create(['is_open'=>true,'closing_time'=>'22:00','timezone'=>'Asia/Manila']);
        $invalidTime = Carbon::now('Asia/Manila')->addMinutes(5)->format('Y-m-d H:i:s');

        $res = $this->actingAs($user,'api')->postJson('/api/order',[
            'order_type'=>'pickup','pickup_time'=>$invalidTime
        ]);
        $res->assertStatus(400);
    }
}

