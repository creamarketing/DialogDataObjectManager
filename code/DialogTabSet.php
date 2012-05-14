<?php

class DialogTabSet extends TabSet {
	
	/**
	 * Render tab set with correct template, to be able to use jQuery tabs
	 */
	public function FieldHolder() {
		return $this->renderWith("DialogTabSet");
	}
	
}

?>