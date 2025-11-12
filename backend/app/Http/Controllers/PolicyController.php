<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Get(
 *     path="/api/policies",
 *     tags={"Policies"},
 *     summary="List all policies",
 *     @OA\Response(response=200, description="Success")
 * )
 *
 * @OA\Get(
 *     path="/api/policies/{type}",
 *     tags={"Policies"},
 *     summary="Get policy by type",
 *     @OA\Parameter(name="type", in="path", required=true, @OA\Schema(type="string"), example="privacy"),
 *     @OA\Response(response=200, description="Success"),
 *     @OA\Response(response=404, description="Not found")
 * )
 *
 * @OA\Put(
 *     path="/api/policies/{id}",
 *     tags={"Policies"},
 *     summary="Update policy (Admin only)",
 *     security={{"bearerAuth":{}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"content"},
 *             @OA\Property(property="content", type="string", example="<p>Updated policy content</p>")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Policy updated"),
 *     @OA\Response(response=403, description="Unauthorized")
 * )
 */


class PolicyController extends Controller
{
    /**
     * Show all policies (for frontend modal display)
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'policies' => Policy::all()
        ]);
    }

    /**
     * Show a specific policy by type (e.g., privacy, terms, refund)
     */
    public function show($type)
    {
        $policy = Policy::where('type', $type)->first();

        if (!$policy) {
            return response()->json(['success' => false, 'message' => 'Policy not found'], 404);
        }

        return response()->json([
            'success' => true,
            'policy' => $policy
        ]);
    }

    /**
     * Update a policy (Admin only)
     */
    public function update(Request $request, $id)
{
    $validator = Validator::make($request->all(), [
        'title' => 'sometimes|string|max:255',
        'content' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    }

    $policy = Policy::findOrFail($id);

    if ($request->has('title')) {
        $policy->title = $request->title;
    }

    $policy->content = $request->content;
    $policy->save();

    return response()->json(['success' => true, 'message' => 'Policy updated successfully']);
}
}
