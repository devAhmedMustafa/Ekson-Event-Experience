<script lang="ts">

    const values = [
        {
            "title": "Attract",
            "sub": "More Visitors",
            "icon": "icons/multiple-users-silhouette.png"
        },
        {
            "title": "Increase",
            "sub": "Engagement",
            "icon": "icons/life-line.png"
        },
        {
            "title": "Encourage",
            "sub": "Interaction",
            "icon": "icons/double-tap.png"
        },
        {
            "title": "Create",
            "sub": "Memorable Experiences",
            "icon": "icons/artificial.png"
        }
    ]

</script>

<ul class="flex justify-center items-center flex-wrap">
    {#each values as value, i}
        <li class="flex flex-col items-center justify-center gap-2 w-69 py-6" style={i < values.length - 1 ? "border-right: 1px solid #bbbbbb;" : ""}>
            <img class="w-16 h-16" src={value.icon} alt=""/>
            <h3 class="text-2xl font-bold text-text">{value.title}</h3>
            <p class="text-md text-text/70 text-center">{value.sub}</p>
        </li>
    {/each}
</ul>