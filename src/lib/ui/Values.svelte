<script lang="ts">

    const values = [
        {
            "title": "Attract",
            "sub": "More Visitors"
        },
        {
            "title": "Increase",
            "sub": "Engagement"
        },
        {
            "title": "Encourage",
            "sub": "Interaction"
        },
        {
            "title": "Create",
            "sub": "Memorable Experiences"
        }
    ]

</script>

<ul class="flex justify-center items-center gap-8 flex-wrap">
    {#each values as value}
        <li class="flex flex-col items-center justify-center gap-2">
            <h3 class="text-2xl font-bold text-text">{value.title}</h3>
            <p class="text-md text-text/70">{value.sub}</p>
        </li>
    {/each}
</ul>