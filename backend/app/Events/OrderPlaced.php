<?php

// app/Events/OrderPlaced.php
namespace App\Events;

use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

class OrderPlaced {
    use Dispatchable, InteractsWithSockets, SerializesModels;
    public $order;
    public function __construct(Order $order){ $this->order=$order; }
}

