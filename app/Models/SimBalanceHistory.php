<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimBalanceHistory extends Model
{
    protected $fillable = [
        'sim_id',
        'type',
        'amount',
        'balance_after',
        'date',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'date' => 'date',
        ];
    }

    public const TYPES = [
        'add' => 'যোগ',
        'deduct' => 'বিয়োগ',
    ];

    public function sim(): BelongsTo
    {
        return $this->belongsTo(Sim::class);
    }
}
